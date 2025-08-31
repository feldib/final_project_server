import nodemailer from 'nodemailer'
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()
import { createConnection } from "mysql2/promise"

const client_host = process.env.CLIENT_HOST

const makeConnection = async () =>
  createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

const sendReplyToMessage = async (message_id, email, reply_title, reply_text) => {
    try{
        const transporter = nodemailer.createTransport({
            service : process.env.TRANSPORTER_SERVICE,
            auth : {
                user : process.env.TRANSPORTER_AUTH_USER,
                pass : process.env.TRANSPORTER_AUTH_PASS
            },
            tls: {
                rejectUnauthorized: false
              }
        })
        const mailOptions = {
        from: process.env.TRANSPORTER_AUTH_USER,
        to: `${email}`,
        subject: `${reply_title}`,
        html: `
            <p>${reply_text}</p>
        `
        };
          
        transporter.sendMail(mailOptions, async function (error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response)
                const connection = await makeConnection()
    
                connection.query(`
                UPDATE messages_to_administrator
                SET answered = true
                WHERE id = ?
                `,[message_id])
    
                connection.end()
            }
        })
    }catch(error){
        console.log(error)
    }
  }

const sendLinkToResetPassword = async ({email, id}) => {
    try{
        const transporter = nodemailer.createTransport({
            service : process.env.TRANSPORTER_SERVICE,
            auth : {
                user : process.env.TRANSPORTER_AUTH_USER,
                pass : process.env.TRANSPORTER_AUTH_PASS
            },
            tls: {
                rejectUnauthorized: false
              }
        })
        
        const token = jwt.sign(
            {id}, 
            process.env.SECRET_KEY,
            {expiresIn: '1d'}
        )

        const mailOptions = {
        from: process.env.TRANSPORTER_AUTH_USER,
        to: `${email}`,
        subject: 'Reset password',
        html: `
            <p>Click here to reset your password: </p>
            <a href = "${client_host}/reset_password?token=${token}&email=${email}">Link</a>
        `
        };
          
        transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
        })
    }catch(error){
        console.log(error)
    }
    
}

export {
    sendReplyToMessage,
    sendLinkToResetPassword
}