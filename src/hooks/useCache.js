let cachedUser = null;
let cachedProfile = null;

export const getCachedUser = () => ({
  user: cachedUser,
  profile: cachedProfile,
});

export const setCachedUser = (user, profile) => {
  cachedUser = user;
  cachedProfile = profile;
};