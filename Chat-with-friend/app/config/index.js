const config = {
    app: {
        port: 3000 ,
        //process.env.port || 
    },
    db: {
        uri:  process.env.MONGODB_URI || "mongodb+srv://admin:<password>@cluster0.ekgkgef.mongodb.net/redi"
    },
    secret: "redi-chat"
};

module.exports = config;
