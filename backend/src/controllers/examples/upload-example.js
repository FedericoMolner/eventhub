// Esempio di utilizzo in events.controller.js
const uploadService = require('../services/upload.service');

async function uploadEventImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Validazione dimensioni immagine
        const isValidDimensions = await uploadService.validateImageDimensions(
            req.file.buffer,
            800, // minWidth
            600  // minHeight
        );

        if (!isValidDimensions) {
            return res.status(400).json({
                error: 'Image dimensions too small. Minimum size is 800x600px'
            });
        }

        // Processo e carico l'immagine
        const { url, filename } = await uploadService.processAndUploadImage(req.file, {
            width: 1200,      // larghezza massima
            height: 800,      // altezza massima
            quality: 85,      // qualità WebP
            folder: 'events'  // sottocartella
        });

        // Se stai aggiornando un evento esistente, elimina la vecchia immagine
        if (req.body.oldImageFilename) {
            try {
                await uploadService.deleteImage(req.body.oldImageFilename);
            } catch (error) {
                console.error('Error deleting old image:', error);
            }
        }

        res.json({
            success: true,
            imageUrl: url,
            filename: filename
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
}