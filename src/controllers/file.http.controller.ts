import FileService from "../services/file.service";
import { Request, Response } from "express";

export class FilesHttpController {
	fileService = new FileService();

	// GET /api/files
	getFilesController = async (req: Request, res: Response) => {
		try {
			const files = await this.fileService.getFiles();
			return res.status(200).json(files);
		} catch (error) {
			console.error("Error getting files:", error);
			return res.status(500).json({ message: "Internal server error" });
		}
	};

	// GET /api/files/:name
	getFileByNameController = async (req: Request, res: Response) => {
		const { name } = req.params;
		try {
			const file = await this.fileService.getFileByName(name);
			if (!file) return res.status(404).json({ message: "File not found" });
			return res.status(200).json(file);
		} catch (error) {
			console.error("Error getting file by name:", error);
			return res.status(500).json({ message: "Internal server error" });
		}
	};
}
