/**
 * Questo file contiene tutti i template HTML per le email
 */

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4A90E2;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #ffffff;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4A90E2;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EventHub</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} EventHub. Tutti i diritti riservati.</p>
            <p>Questa è un'email automatica, per favore non rispondere.</p>
        </div>
    </div>
</body>
</html>
`;

const templates = {
    welcome: (data) => baseTemplate(`
        <h2>Benvenuto su EventHub, ${data.name}!</h2>
        <p>Siamo felici di averti con noi! Per iniziare ad utilizzare il tuo account, per favore verifica il tuo indirizzo email.</p>
        <p>
            <a href="${data.verificationUrl}" class="button">Verifica Email</a>
        </p>
        <p>Se non hai creato tu questo account, puoi ignorare questa email.</p>
    `),

    resetPassword: (data) => baseTemplate(`
        <h2>Ciao ${data.name},</h2>
        <p>Abbiamo ricevuto una richiesta di reset della password per il tuo account.</p>
        <p>Per procedere con il reset della password, clicca sul pulsante qui sotto:</p>
        <p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
        </p>
        <p>Se non hai richiesto tu il reset della password, puoi ignorare questa email.</p>
        <p>Questo link scadrà tra 10 minuti.</p>
    `),

    eventRegistration: (data) => baseTemplate(`
        <h2>Ciao ${data.name},</h2>
        <p>La tua registrazione all'evento "${data.eventTitle}" è stata confermata!</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
            <h3>Dettagli Evento:</h3>
            <p><strong>Data:</strong> ${data.eventDate}</p>
            <p><strong>Ora:</strong> ${data.eventTime}</p>
            <p><strong>Luogo:</strong> ${data.location}</p>
        </div>
        <p>
            <a href="${process.env.FRONTEND_URL}/events/${data.eventId}" class="button">Visualizza Evento</a>
        </p>
        <p>Puoi accedere alla chat dell'evento dalla pagina dell'evento per comunicare con gli altri partecipanti.</p>
    `),

    eventCancellation: (data) => baseTemplate(`
        <h2>Ciao ${data.name},</h2>
        <p>Ci dispiace informarti che l'evento "${data.eventTitle}" previsto per il ${data.eventDate} è stato cancellato.</p>
        <p>Se hai acquistato dei biglietti, riceverai il rimborso entro i prossimi giorni lavorativi.</p>
        <p>Ci scusiamo per l'inconveniente.</p>
    `)
};

module.exports = templates;