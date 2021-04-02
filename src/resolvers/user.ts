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
import { COOKIE_NAME } from "../constants";
import { UsernameAndPassword } from "../utils/UsernameAndPassword";
import { FieldError } from "../utils/FieldError";
import { validateRegister } from "../utils/validateRegister";

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
  me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      // not logged in
      return null;
    }

    const user = em.findOne(User, { id: req.session.userId });

    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernameAndPassword,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const { email, username, password } = options;

    const errors = validateRegister(email, username, password);
    if (errors) return { errors };

    const hashedPassword = await argon2.hash(password);
    const user = em.create(User, {
      email,
      username,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
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
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
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
}
