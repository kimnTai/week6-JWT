import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import * as Model from "../model";

class UsersController {
    getUsers = async (req: Request, res: Response): Promise<void> => {
        const { limit } = req.query;
        const result = await Model.Users.find()
            .sort("-createdAt")
            .limit(Number(limit) ?? 10);
        res.send({ status: "success", result });
    };

    /**
     * @description 註冊
     * @param {Request} req
     * @param {Response} res
     * @memberof UsersController
     */
    signUp = async (req: Request, res: Response): Promise<void> => {
        const { name, email, password: originPassword } = req.body;
        if (await Model.Users.findOne({ email })) {
            throw new Error("此 Email 已被註冊!");
        }
        const password = await bcrypt.hash(originPassword, 12);
        const result = await Model.Users.create({ name, email, password });
        (<any>result).password = undefined;
        res.send({ status: "success", result });
    };

    /**
     * @description 登入
     * @param {Request} req
     * @param {Response} res
     * @memberof UsersController
     */
    signIn = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body;
        const user = await Model.Users.findOne({ email }).select("+password");
        if (!user) {
            throw new Error("此 Email 不存在!");
        }
        if (!(await bcrypt.compare(password, user.password))) {
            throw new Error("密碼錯誤!");
        }
        const Secret = process.env.JWT_SECRET as string;
        const token = jwt.sign({ email }, Secret, { expiresIn: process.env.JWT_EXPIRES_DAY });
        res.send({ status: "success", message: "登入成功", token });
    };

    /**
     * @description 重設密碼
     * @memberof UsersController
     */
    updatePassword = async (req: Request, res: Response) => {
        const { id, password: newPassword } = req.body;
        const password = await bcrypt.hash(newPassword, 12);
        const result = await Model.Users.findByIdAndUpdate(id, { password });
        if (!result) {
            throw new Error("此 id 不存在");
        }
        res.send({ status: "success", message: "密碼重設成功" });
    };
}

export default new UsersController();
