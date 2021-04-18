import Dataloader from "dataloader";
import { User } from "../entities/User";

export const createUserLoader = () =>
  new Dataloader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdtoUser: Record<number, User> = {};
    // mapping user ids to its objects
    users.forEach((u) => {
      userIdtoUser[u.id] = u;
    });

    // returning the objects according to the user ids
    return userIds.map((userId) => userIdtoUser[userId]);
  });
