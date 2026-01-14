
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendAccessRequestEmail(userEmail: string, userName: string) {
    const adminEmail = 'andrestablarico@gmail.com'

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: adminEmail,
        subject: `Nueva Solicitud de Acceso: ${userName}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Nueva Solicitud de Acceso</h2>
                <p>Un usuario ha solicitado acceso a la plataforma Methodology Builder.</p>
                <br/>
                <p><strong>Nombre:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <br/>
                <p>Por favor, ingresa al panel de administración para Aprobar o Rechazar esta solicitud.</p>
                <br/>
                <a href="${process.env.NEXTAUTH_URL}/admin" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Panel de Admin</a>
            </div>
        `,
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log(`Email notification sent to ${adminEmail} for user ${userEmail}`)
    } catch (error) {
        console.error('Error sending email notification:', error)
        // Don't throw, we don't want to block the user flow if email fails
    }
}
