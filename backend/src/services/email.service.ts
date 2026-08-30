import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
});

function loadTemplate(name: string, vars: Record<string, string>): string {
  const filePath = path.join(process.cwd(), 'templates', name);
  let html = fs.readFileSync(filePath, 'utf8');
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  guestName: string;
  bookingId: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalPrice: string;
}): Promise<void> {
  const html = loadTemplate('booking-confirmation.html', {
    hotelName: env.hotelName,
    guestName: params.guestName,
    bookingId: params.bookingId,
    roomNumber: params.roomNumber,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    totalPrice: params.totalPrice,
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to: params.to,
    subject: `Booking confirmed — ${env.hotelName}`,
    html,
  });
}

export async function sendBookingCancellationEmail(params: {
  to: string;
  guestName: string;
  bookingId: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
}): Promise<void> {
  const html = loadTemplate('booking-cancellation.html', {
    hotelName: env.hotelName,
    guestName: params.guestName,
    bookingId: params.bookingId,
    roomNumber: params.roomNumber,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to: params.to,
    subject: `Booking cancelled — ${env.hotelName}`,
    html,
  });
}

export async function sendStaffInviteEmail(params: {
  to: string;
  name: string;
  role: string;
  tempPassword: string;
}): Promise<void> {
  const html = loadTemplate('staff-invite.html', {
    hotelName: env.hotelName,
    name: params.name,
    role: params.role,
    email: params.to,
    tempPassword: params.tempPassword,
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to: params.to,
    subject: `You're invited to ${env.hotelName}`,
    html,
  });
}
