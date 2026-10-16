import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import PDFDocument from "pdfkit";

export interface TicketPdfService {
  name: string;
  price: string;
  durationMin: number;
  startsAt: Date;
  endsAt: Date;
}

export interface TicketPdfData {
  reference: string;
  salonName: string;
  salonAddress: string;
  services: TicketPdfService[];
  timezone: string;
  ticketKey: string;
}

function getEncryptionKey(): Buffer {
  const value = process.env.BOOKING_TICKET_ENCRYPTION_KEY;

  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      "BOOKING_TICKET_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hex characters",
    );
  }

  return Buffer.from(value, "hex");
}

export function createTicketPdf(data: TicketPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const formatDate = (date: Date) =>
      date.toLocaleDateString("en-IN", {
        timeZone: data.timezone,
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

    const formatTime = (date: Date) =>
      date.toLocaleTimeString("en-IN", {
        timeZone: data.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    const totalPrice = data.services.reduce(
      (total, service) => total + Number(service.price),
      0,
    );

    const totalDuration = data.services.reduce(
      (total, service) => total + service.durationMin,
      0,
    );

    doc.fontSize(24).text("Snipr", { align: "center" });
    doc.moveDown(0.4);

    doc.fontSize(18).text("Booking Ticket", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(12).text(`Booking reference: ${data.reference}`);
    doc.moveDown(0.5);

    doc.fontSize(16).text(data.salonName);
    doc.fontSize(11).text(data.salonAddress || "Address not provided");
    doc.moveDown(1);

    if (data.services.length > 0) {
      doc.fontSize(12).text(`Date: ${formatDate(data.services[0].startsAt)}`);
    }

    doc.moveDown(0.8);
    doc.fontSize(15).text("Selected Services");
    doc.moveDown(0.5);

    data.services.forEach((service, index) => {
      // Leave enough space for a service entry before starting a new page.
      if (doc.y > 680) {
        doc.addPage();
      }

      doc
        .fontSize(12)
        .text(`${index + 1}. ${service.name}`, { continued: false });

      doc
        .fontSize(10)
        .text(
          `Time: ${formatTime(service.startsAt)} – ${formatTime(service.endsAt)}`,
        );

      doc.text(`Price: ${service.price}`);
      doc.text(`Service duration: ${service.durationMin} minutes`);
      doc.moveDown(0.8);
    });

    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total services: ${data.services.length}`);
    doc.text(`Total service duration: ${totalDuration} minutes`);
    doc.fontSize(14).text(`Total price: ${totalPrice.toFixed(2)}`);

    doc.moveDown(1.5);
    doc.fontSize(14).text("Private verification key");
    doc.moveDown(0.4);

    doc.fontSize(12).text(data.ticketKey, {
      width: 480,
      characterSpacing: 0.5,
    });

    doc.moveDown(0.8);
    doc
      .fontSize(9)
      .text(
        "Keep this key private. Present it to the salon when asked to verify your booking.",
      );

    doc.end();
  });
}

export function generateTicketKey(): string {
  return randomBytes(24).toString("base64url");
}

export function hashTicketKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function encryptTicketKey(key: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  const encrypted = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);

  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptTicketKey(encryptedValue: string): string {
  const [version, ivHex, tagHex, ciphertextHex] = encryptedValue.split(":");

  if (version !== "v1" || !ivHex || !tagHex || !ciphertextHex) {
    throw new Error("Invalid encrypted ticket-key format");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
