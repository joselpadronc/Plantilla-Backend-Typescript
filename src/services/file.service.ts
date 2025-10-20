import axios from "axios";
import { config } from "../config";

export default class FileService {
	private baseUrl: string;

	constructor() {
		this.baseUrl = config.EXTERNAL_API_URL || "http://localhost:4000/api";
	}

	async getFileByName(name: string): Promise<{} | null> {
		try {
			// The external API returns: { files: ["string"] }
			// We'll fetch the list and find the requested name (no dedicated endpoint assumed).
			const resp = await axios.get(`${this.baseUrl}/files`);
			const items = resp.data && Array.isArray(resp.data.files) ? resp.data.files : [];
			const found = (items as string[]).find((f) => f === name);
			if (!found) return null;
			// Build a minimal FileModel from the name
			return '';
		} catch (error: any) {
			console.error("Error fetching file by name:", error?.message || error);
			throw new Error("External api error while fetching file by name");
		}
	}

	async getFiles(): Promise<[]> {
		try {
			const resp = await axios.get(`${this.baseUrl}/files`);
			const items = resp.data && Array.isArray(resp.data.files) ? resp.data.files : [];
			// items is an array of strings (names)
			return items;
		} catch (error: any) {
			console.error("Error fetching files:", error?.message || error);
			throw new Error("External api error while fetching files");
		}
	}
}
