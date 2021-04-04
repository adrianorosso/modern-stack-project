import { User } from "../entities/User";
import {
  Resolver,
  Ctx,
  Mutation,
  Field,
  Arg,
  ObjectType,
  Query,
} from "type-graphql";
import { MyContext } from "../types";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernameAndPassword } from "../utils/UsernameAndPassword";
import { FieldError } from "../utils/FieldError";
import { validateRegister } from "../utils/validateRegister";
import { sendMail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      // not logged in
      return null;
    }

    return User.findOne({ id: req.session.userId });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernameAndPassword,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const { email, username, password } = options;

    const errors = validateRegister(email, username, password);
    if (errors) return { errors };

    const hashedPassword = await argon2.hash(password);
    let user;
    try {
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          email,
          username,
          password: hashedPassword,
        })
        .returning("*")
        .execute();

      user = result.raw;
    } catch (err) {
      if (err.code == "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username is already in use.",
            },
          ],
        };
      }
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );

    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "Invalid usernameOrEmail",
          },
        ],
      };
    }

    const validPassword = await argon2.verify(user.password, password);

    if (!validPassword) {
      return {
        errors: [
          {
            field: "password",
            message: "wrong password",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      res.clearCookie(COOKIE_NAME);
      req.session.destroy((err: Error) => {
        if (err) {
          console.error(err);
          return resolve(false);
        }

        return resolve(true);
      });
    });
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Ctx() { redis }: MyContext,
    @Arg("email") email: string
  ) {
    const user = await User.findOne({ where: { email } });

    // Email does not exist, but won't tell the user for security reasons
    if (!user) return true;

    const token = v4();

    redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 + 24 + 3
    ); // 3 days

    await sendMail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">Change password</a>`
    );

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("newPassword") newPassword: string,
    @Arg("token") token: string,
    @Ctx() { redis }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 3) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "password should be greater than 3.",
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired.",
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);

    const user = await User.findOne({ id: userIdNum });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exist",
          },
        ],
      };
    }

    User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key);

    // log in the user after changing password
    // req.session.id = userId;

    return { user };
  }
}
