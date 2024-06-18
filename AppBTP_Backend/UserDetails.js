const mongoose=require("mongoose");

const UserDetailSchema = new mongoose.Schema(
    {
    password: String,
    email: { type: String, unique: true },
    },
    {
    collection:"UserInfo"
    }
);
mongoose.model("UserInfo", UserDetailSchema);