import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport/index.js";

import config from "../config.js";
import makeConnection from "../connection.js";

const client_host = config.server.clientHost;

export const sendReplyToMessage = async (
  message_id: number,
  email: string,
  reply_title: string,
  reply_text: string
): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: config.email.service,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: config.email.auth.user,
      to: `${email}`,
      subject: `${reply_title}`,
      html: `
            <p>${reply_text}</p>
        `,
    };

    transporter.sendMail(
      mailOptions,
      async function (
        error: Error | null,
        _info: SMTPTransport.SentMessageInfo
      ) {
        if (error) {
          console.error(error);
        } else {
          const connection = await makeConnection();

          connection.query(
            `
                UPDATE messages_to_administrator
                SET answered = true
                WHERE id = ?
                `,
            [message_id]
          );

          connection.end();
        }
      }
    );
  } catch (error) {
    console.error(error);
  }
};

export const sendLinkToResetPassword = async ({
  email,
  id,
}: {
  email: string;
  id: number;
}): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: config.email.service,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const token = jwt.sign({ id }, config.security.secretKey, {
      expiresIn: "1d",
    });

    const mailOptions = {
      from: config.email.auth.user,
      to: `${email}`,
      subject: "Reset password",
      html: `
            <p>Click here to reset your password: </p>
            <a href = "${client_host}/reset_password?token=${token}&email=${email}">Link</a>
        `,
    };

    transporter.sendMail(
      mailOptions,
      function (error: Error | null, _info: SMTPTransport.SentMessageInfo) {
        if (error) {
          console.error(error);
        }
      }
    );
  } catch (error) {
    console.error(error);
  }
};
