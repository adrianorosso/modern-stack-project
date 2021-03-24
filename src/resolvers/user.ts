import { User } from "../entities/User";
import { Resolver, Ctx, Mutation, InputType, Field, Arg } from "type-graphql";
import { MyContext } from "../types";
import argon2 from "argon2";

@InputType()
class UsernameAndPassword {
  @Field()
  username: string;
  @Field()
  password: string;
}

@Resolver()
export class UserResolver {
  @Mutation(() => User)
  async register(
    @Arg("options") options: UsernameAndPassword,
    @Ctx() { em }: MyContext
  ) {
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    await em.persistAndFlush(user);

    return user;
  }
}
