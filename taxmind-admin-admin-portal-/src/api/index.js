// Barrel exports for API client
import http, { setToken, getToken, setAdminEmail, getAdminEmail } from "./http";

import * as auth from "./modules/auth";
import * as admins from "./modules/admins";
import * as rbac from "./modules/rbac";
import * as blogs from "./modules/blogs";
import * as applications from "./modules/applications";
import * as users from "./modules/users";
import * as files from "./modules/files";
import * as questionnaire from "./modules/questionnaire";
import * as siteContent from "./modules/siteContent";

export {
  http,
  setToken,
  getToken,
  setAdminEmail,
  getAdminEmail,
  auth,
  admins,
  rbac,
  blogs,
  applications,
  users,
  files,
  questionnaire,
  siteContent,
};
