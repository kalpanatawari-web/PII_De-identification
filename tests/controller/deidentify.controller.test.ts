import { Request, Response } from "express";
import { DeidentifyController } from "../../src/controller/deidentify.controller";
import { deidentifyService } from "../../src/services/deidentify.service";

jest.mock("../../src/services/deidentify.service", () => ({
  deidentifyService: {
    deidentifyText: jest.fn(),
  },
}));

describe("DeidentifyController.postData", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe("400 - Validation Errors", () => {
    const invalidInputs = [
      { label: "req.body is undefined", body: undefined },
      { label: "text property is missing", body: {} },
      { label: "text is null", body: { text: null } },
      { label: "text is a number", body: { text: 12345 } },
      { label: "text is a boolean", body: { text: true } },
      { label: "text is an object", body: { text: { data: "test" } } },
      { label: "text is an empty string", body: { text: "" } },
      { label: "text contains only whitespace", body: { text: "   \t\n  " } },
    ];

    invalidInputs.forEach(({ label, body }) => {
      it(`should return 400 when ${label}`, () => {
        mockReq.body = body;

        DeidentifyController.postData(mockReq as Request, mockRes as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
          message: "Text is required and must be a non-empty string",
        });
        expect(deidentifyService.deidentifyText).not.toHaveBeenCalled();
      });
    });
  });

  describe("413 - Payload Too Large", () => {
    it("should return 413 when text exceeds 5000 characters", () => {
      mockReq.body = { text: "a".repeat(5001) };

      DeidentifyController.postData(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(413);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Payload too large. Maximum supported text length is 5000 characters.",
      });
      expect(deidentifyService.deidentifyText).not.toHaveBeenCalled();
    });
  });

  describe("200 - Successful De-identification", () => {
    it("should process valid text and return 200 with de-identified result", () => {
      const inputText = "Contact support@example.com for help.";
      const serviceResult = {
        originalText: inputText,
        deidentifiedText: "Contact [EMAIL] for help.",
        detectedEntities: ["EMAIL"],
      };

      (deidentifyService.deidentifyText as jest.Mock).mockReturnValue(serviceResult);
      mockReq.body = { text: inputText };

      DeidentifyController.postData(mockReq as Request, mockRes as Response);

      expect(deidentifyService.deidentifyText).toHaveBeenCalledWith(inputText);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: serviceResult,
      });
    });

    it("should accept text with exactly 5000 characters", () => {
      const boundaryText = "x".repeat(5000);
      const serviceResult = {
        originalText: boundaryText,
        deidentifiedText: boundaryText,
        detectedEntities: [],
      };

      (deidentifyService.deidentifyText as jest.Mock).mockReturnValue(serviceResult);
      mockReq.body = { text: boundaryText };

      DeidentifyController.postData(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(deidentifyService.deidentifyText).toHaveBeenCalledWith(boundaryText);
    });
  });

  describe("500 - Internal Server Error", () => {
    it("should log error and return 500 if the service throws an exception", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Regex processing failed");

      (deidentifyService.deidentifyText as jest.Mock).mockImplementation(() => {
        throw error;
      });

      mockReq.body = { text: "Some valid text" };

      DeidentifyController.postData(mockReq as Request, mockRes as Response);

      expect(consoleSpy).toHaveBeenCalledWith("De-identification error:", error);
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error",
      });

      consoleSpy.mockRestore();
    });
  });
});