import { Request, Response } from "express";
import { Redis } from "ioredis";
import Dataloader from "dataloader";
import { User } from "./entities/User";

export type MyContext = {
  req: Request & { session: any };
  res: Response;
  redis: Redis;
  userLoader: Dataloader<number, User>;
};
