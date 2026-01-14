
import nodemailer from 'nodemailer'
import { SystemSettingsService } from './settings'

const getTransporter = async () => {
    const config = await SystemSettingsService.getEmailConfig()

    if (!config) {
        throw new Error('Email configuration not found in System Settings')
    }

    return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true for 465, false for other ports
        auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
        },
    })
}

export async function sendAccessRequestEmail(userEmail: string, userName: string) {
    const adminEmail = 'andrestablarico@gmail.com'

    try {
        const transporter = await getTransporter()
        const config = await SystemSettingsService.getEmailConfig()

        if (!config) return

        const mailOptions = {
            from: config.smtpUser,
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

        await transporter.sendMail(mailOptions)
        console.log(`Email notification sent to ${adminEmail} for user ${userEmail}`)
    } catch (error) {
        console.error('Error sending email notification:', error)
        // Don't throw, we don't want to block the user flow if email fails
    }
}
