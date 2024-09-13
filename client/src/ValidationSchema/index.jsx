import * as yup from "yup";
export const SignUpSchema = yup.object({
  email: yup
    .string()
    .required("This field is required")
    .matches(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
      "Please enter a valid email address"
    ),
  password: yup
    .string()
    .required("Password is required")
    .min(4, "Password length should be at least 4 characters")
    .max(12, "Password cannot exceed more than 12 characters"),
  confirmPassword: yup
    .string()
    .required("Confirm Password is required")
    .min(4, "Password length should be at least 4 characters")
    .max(12, "Password cannot exceed more than 12 characters")
    .oneOf([yup.ref("password")], "Passwords do not match"),
  accept: yup.boolean(true).required(),
});
