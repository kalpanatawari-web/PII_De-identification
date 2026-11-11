import type { Request, Response } from "express";
import { deidentifyService } from "../services/deidentify.service";

const MAX_TEXT_LENGTH = 5000;

export class DeidentifyController {

  static postData(req: Request, res: Response) {
    const { text } = req.body ?? {};
    // Validate text
    if (typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({
        message: 'Text is required and must be a non-empty string',
      });
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      res.status(413).json({
        success: false,
        message: `Payload too large. Maximum supported text length is ${MAX_TEXT_LENGTH} characters.`,
      });
      return;
    }
    try {
      const result = deidentifyService.deidentifyText(text);

      res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error) {
      console.error('De-identification error:', error);

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}