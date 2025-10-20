export const config = {
	PORT: process.env.PORT || 3000,
	MONGODB_URI: "mongodb://root:root@localhost:27017/chats?authSource=admin",
	EXTERNAL_API_URL: process.env.EXTERNAL_API_URL || "http://localhost:4000/api",
};
