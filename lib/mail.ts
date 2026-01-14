
import nodemailer from 'nodemailer'
import { SystemSettingsService, EmailConfig } from './settings'

const getTransporter = async (overrideConfig?: EmailConfig) => {
    const config = overrideConfig || await SystemSettingsService.getEmailConfig()

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
        const config = await SystemSettingsService.getEmailConfig()
        if (!config) return

        const transporter = await getTransporter(config)

        // Determine sender: "Name <email>" or just email
        const fromName = config.senderName || 'Methodology Builder'
        const fromEmail = config.senderEmail || config.smtpUser
        const from = `"${fromName}" <${fromEmail}>`

        const mailOptions = {
            from,
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
    }
}

export async function sendTestEmail(to: string, config: EmailConfig) {
    try {
        const transporter = await getTransporter(config)

        const fromName = config.senderName || 'Methodology Builder Test'
        const fromEmail = config.senderEmail || config.smtpUser
        const from = `"${fromName}" <${fromEmail}>`

        const mailOptions = {
            from,
            to,
            subject: `Prueba de Configuración de Correo`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>¡Configuración Exitosa!</h2>
                    <p>Este es un correo de prueba enviado desde Methodology Builder.</p>
                    <br/>
                    <p><strong>Configuración utilizada:</strong></p>
                    <ul>
                        <li>Host: ${config.smtpHost}</li>
                        <li>Puerto: ${config.smtpPort}</li>
                        <li>Usuario: ${config.smtpUser}</li>
                        <li>Remitente: ${from}</li>
                    </ul>
                </div>
            `,
        }

        await transporter.sendMail(mailOptions)
        return { success: true }
    } catch (error: any) {
        console.error('Error sending test email:', error)
        throw new Error(error.message || 'Error sending test email')
    }
}
