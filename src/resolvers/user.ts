import { User } from "../entities/User";
import {
  Resolver,
  Ctx,
  Mutation,
  InputType,
  Field,
  Arg,
  ObjectType,
} from "type-graphql";
import { MyContext } from "../types";
import argon2 from "argon2";

@InputType()
class UsernameAndPassword {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field(() => String, { nullable: true })
  field: string;
  @Field(() => String, { nullable: true })
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernameAndPassword,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const { username, password } = options;

    if (username.length <= 2 || password.length <= 2) {
      return {
        errors: [
          {
            field: "username/password",
            message: "username and password should be greater than 2.",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(password);
    const user = em.create(User, {
      username: username,
      password: hashedPassword,
    });

    await em.persistAndFlush(user);

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernameAndPassword,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const errorMsg = {
      errors: [
        {
          field: "username/password",
          message: "invalid username or passoword",
        },
      ],
    };

    const user = await em.findOne(User, { username: options.username });
    if (!user) return errorMsg;

    const validPassword = await argon2.verify(user.password, options.password);
    if (!validPassword) return errorMsg;

    return { user };
  }
}
