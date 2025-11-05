const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class UploadService {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        
        if (this.isProduction) {
            // Configurazione S3 per production
            this.s3Client = new S3Client({
                region: process.env.AWS_REGION,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            });
            this.s3Bucket = process.env.AWS_S3_BUCKET;
        } else {
            // Configurazione storage locale per development
            this.uploadDir = path.join(__dirname, '../../uploads');
            this.ensureUploadDirectory();
        }

        // Configurazione multer
        this.upload = multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
            fileFilter: this._fileFilter
        });
    }

    async ensureUploadDirectory() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        } catch (error) {
            console.error('Error creating upload directory:', error);
        }
    }

    _fileFilter(req, file, cb) {
        // Controlla il tipo di file
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'), false);
        }
    }

    async processAndUploadImage(file, options = {}) {
        try {
            const {
                width = 800,
                height = 800,
                quality = 80,
                folder = 'events'
            } = options;

            // Processa l'immagine con Sharp
            let processedImage = sharp(file.buffer)
                .resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality });

            const processedBuffer = await processedImage.toBuffer();

            // Genera un nome file unico
            const filename = `${folder}/${uuidv4()}.webp`;

            if (this.isProduction) {
                // Upload su S3
                await this._uploadToS3(filename, processedBuffer);
                const url = await this._getS3Url(filename);
                return { url, filename };
            } else {
                // Salvataggio locale
                const localPath = path.join(this.uploadDir, filename);
                await fs.mkdir(path.dirname(localPath), { recursive: true });
                await fs.writeFile(localPath, processedBuffer);
                const url = `/uploads/${filename}`;
                return { url, filename };
            }
        } catch (error) {
            console.error('Error processing and uploading image:', error);
            throw new Error('Failed to process and upload image');
        }
    }

    async _uploadToS3(filename, buffer) {
        const command = new PutObjectCommand({
            Bucket: this.s3Bucket,
            Key: filename,
            Body: buffer,
            ContentType: 'image/webp'
        });

        try {
            await this.s3Client.send(command);
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload to S3');
        }
    }

    async _getS3Url(filename) {
        // Per immagini pubbliche, costruisci l'URL direttamente
        return `https://${this.s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
        
        // Per URL firmati (se necessario)
        // const command = new GetObjectCommand({
        //     Bucket: this.s3Bucket,
        //     Key: filename
        // });
        // return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    }

    async deleteImage(filename) {
        try {
            if (this.isProduction) {
                // Elimina da S3
                const command = new DeleteObjectCommand({
                    Bucket: this.s3Bucket,
                    Key: filename
                });
                await this.s3Client.send(command);
            } else {
                // Elimina dal filesystem locale
                const localPath = path.join(this.uploadDir, filename);
                await fs.unlink(localPath);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            throw new Error('Failed to delete image');
        }
    }

    getMulterMiddleware() {
        return this.upload.single('image');
    }

    // Utility per validare le dimensioni dell'immagine prima dell'upload
    async validateImageDimensions(buffer, minWidth = 200, minHeight = 200) {
        try {
            const metadata = await sharp(buffer).metadata();
            return metadata.width >= minWidth && metadata.height >= minHeight;
        } catch (error) {
            console.error('Error validating image dimensions:', error);
            return false;
        }
    }
}

module.exports = new UploadService();