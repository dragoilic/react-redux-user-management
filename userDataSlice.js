import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { Storage } from "../helpers/Storage";
import { walletOperations } from "./walletSlice";

const APIUrl = process.env.REACT_APP_PRO_API;

const initialState = {
  loading: true,
  error: null,
  authVerified: false,
  user: {
    email: "",
    id: "",
    role: "",
    userName: "",
    displayName: "",
    about: "",
    access: {
      allow: false,
    },
    authentication: {
      approved: false,
    },
  },
  tokens: {
    access: {
      token: "",
      expires: "",
    },
    refresh: {
      token: "",
      expires: "",
    },
  },
};

const userData = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    setHasAccess(state, action) {
      state.user.access.allow = action.payload;
    },
    setTokens(state, action) {
      state.tokens = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const userDataActions = userData.actions;

const getRoot = (state) => state.userData;

export const userDataSelectors = {
  getLoading: (state) => getRoot(state).isLoading,
  getUser: (state) => getRoot(state).user,
  getTokens: (state) => getRoot(state).tokens,
};

export const userDataOperations = {
  userInit: () => async (dispatch, getState) => {
    dispatch(userDataActions.setLoading(true));
    const user = Storage.getItem("userData");
    if (user) {
      const parsedUser = JSON.parse(user);
      dispatch(userDataOperations.setUser(parsedUser.user, parsedUser.tokens));
    }
    dispatch(userDataActions.setLoading(false));
  },

  initRequest: () => async (dispatch, getState) => {
    dispatch(userDataActions.setLoading(true));
    dispatch(userDataActions.setError(null));
  },

  setUser: (user, tokens) => async (dispatch, getState) => {
    dispatch(userDataActions.setUser(user));
    if (tokens) {
      dispatch(userDataActions.setTokens(tokens));
    }
    Storage.setItem("userData", JSON.stringify({ user, tokens }));
  },

  register: (signupData) => async (dispatch, getState) => {
    dispatch(userDataOperations.initRequest());
    try {
      const { data } = await axios.post(`${APIUrl}/v1/auth/register`, signupData);

      Storage.setItem("userData", JSON.stringify(data));
      dispatch(userDataOperations.setUser(data.user, data.tokens));
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message || err.response.data));
    }
    dispatch(userDataActions.setLoading(false));
  },

  signin: (signinData) => async (dispatch, getState) => {
    dispatch(userDataOperations.initRequest());
    try {
      const { data } = await axios.post(`${APIUrl}/v1/auth/login`, signinData);
      Storage.setItem("userData", JSON.stringify(data));
      dispatch(userDataOperations.setUser(data.user, data.tokens));
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message));
    }
    dispatch(userDataActions.setLoading(false));
  },

  logout: () => async (dispatch, getState) => {
    const tokens = getState().userData.tokens;

    try {
      Storage.removeItem("userData");

      const data = {
        refreshToken: tokens.refresh.token,
      };

      await axios.post(`${APIUrl}/v1/auth/logout`, data);
      dispatch(userDataActions.setUser(initialState.user));
      dispatch(userDataActions.setTokens(initialState.tokens));
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message));
    }
  },

  updateProfile: (data) => async (dispatch, getState) => {
    const state = getState();
    const tokens = state.userData.tokens;

    delete data.inputsChanged;

    const config = {
      headers: {
        Authorization: tokens.refresh.token,
      },
    };

    const update = {
      ...data,
    };

    try {
      const { data } = await axios.put(`${APIUrl}/v1/auth/update-profile`, update, config);
      dispatch(userDataOperations.setUser(data));
      Storage.setItem("userData", JSON.stringify({ tokens, user: data }));
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message));
    }
  },

  resetPasswordProfile: (data) => async (dispatch, getState) => {
    const config = {
      headers: {
        Authorization: getState().userData.tokens.refresh.token,
      },
    };

    try {
      await axios.post(`${APIUrl}/v1/auth/reset-password-profile`, data, config);
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message));
    }
  },

  approveEmail: (token) => async (dispatch, getState) => {
    const config = {
      headers: {
        Authorization: token,
      },
    };

    try {
      const { data } = await axios.post(`${APIUrl}/v1/auth/approve-email`, {}, config);
      dispatch(userDataOperations.setUser(data));
      Storage.setItem("userData", JSON.stringify({ tokens: getState().userData.tokens, user: data }));
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message));
    }
  },

  resendVerificationEmail: () => async (dispatch, getState) => {
    const config = {
      headers: {
        Authorization: getState().userData.tokens.refresh.token,
      },
    };

    try {
      await axios.post(`${APIUrl}/v1/auth/send-verification-email`, {}, config);
      return true;
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message));
      return false;
    }
  },

  approveStakeKeyfi: (method) => async (dispatch, getState) => {
    const state = getState();
    const token = state.userData.tokens.refresh.token;
    const stakingAddress = state.user.id;

    const config = {
      headers: {
        Authorization: token,
      },
    };

    const methodData = {
      method,
      stakingAddress,
    };

    try {
      if (stakingAddress) {
        const { data } = await axios.post(`${APIUrl}/v1/auth/provide-access`, methodData, config);
        Storage.setItem("userData", JSON.stringify({ tokens: state.userData.tokens, user: data }));
        dispatch(userDataOperations.setUser(data));
      }
    } catch (err) {
      await dispatch(walletOperations.disconnect());
      dispatch(userDataActions.setError(err.response.data.message || err.response.data));
    }
  },

  getAuthToken: () => async (dispatch, getState) => {
    const token = getState().userData.tokens.refresh.token;

    const config = {
      headers: {
        Authorization: token,
      },
    };

    try {
      const { data } = await axios.get(`${APIUrl}/v1/auth/get-auth-token`, config);
      return data;
    } catch (err) {
      console.log(err);
    }
  },

  verifyAuthToken: (secret) => async (dispatch, getState) => {
    dispatch(userDataOperations.initRequest());
    const state = getState();
    const token = state.userData.tokens.refresh.token;
    const user = state.userData.user;

    const config = {
      headers: {
        Authorization: token,
      },
    };

    try {
      await axios.post(`${APIUrl}/v1/auth/verify-auth-token`, { secret }, config);

      const userData = {
        ...user,
        authVerified: true,
        authentication: {
          approved: true,
        },
      };

      dispatch(userDataActions.setUser(userData));
      Storage.setItem("userData", JSON.stringify({ tokens: state.userData.tokens, user: userData }));
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message || err.response.data));
    }
    dispatch(userDataActions.setLoading(false));
  },

  disableAuth: () => async (dispatch, getState) => {
    dispatch(userDataOperations.initRequest());
    const state = getState();
    const token = state.userData.tokens.refresh.token;
    const user = state.userData.user;

    const config = {
      headers: {
        Authorization: token,
      },
    };

    try {
      await axios.post(`${APIUrl}/v1/auth/disable-auth`, {}, config);
      const userData = {
        ...user,
        authVerified: false,
        authentication: {
          approved: false,
        },
      };
      dispatch(userDataActions.setUser(userData));
      Storage.setItem("userData", JSON.stringify({ tokens: state.userData.tokens, user: userData }));
    } catch (err) {
      dispatch(userDataActions.setError(err.response.data.message || err.response.data));
    }
    dispatch(userDataActions.setLoading(false));
  },
};

export const userDataReducer = userData.reducer;
