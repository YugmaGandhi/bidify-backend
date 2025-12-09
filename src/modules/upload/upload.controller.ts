import { Request, Response } from 'express';

export const uploadFile = (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }

    // Construct the public URL
    // In production (S3), this would be the S3 URL.
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
        message: 'Upload successful',
        data: {
            url: fileUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype
        }
    });
};