const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Errore di validazione',
            details: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: 'Violazione di unicità',
            details: err.errors.map(e => ({
                field: e.path,
                message: 'Questo valore deve essere unico'
            }))
        });
    }

    res.status(500).json({
        error: 'Errore interno del server',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Si è verificato un errore'
    });
};

module.exports = errorHandler;