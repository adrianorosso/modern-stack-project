import { FieldError } from "src/utils/FieldError";

export const validateRegister = (
  email: string,
  username: string,
  password: string
) => {
  let errors: FieldError[] | null = [];

  if (username.includes("@")) {
    errors.push({
      field: "username",
      message: "@ not allowed in username.",
    });
  }

  if (!email.includes("@")) {
    errors.push({
      field: "email",
      message: "invalid email.",
    });
  }

  if (username.length <= 2) {
    errors.push({
      field: "username",
      message: "username should be greater than 2.",
    });
  }

  if (password.length <= 3) {
    errors.push({
      field: "password",
      message: "password should be greater than 3.",
    });
  }

  if (errors.length > 0) return errors;

  return null;
};
