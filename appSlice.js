import { createSlice } from "@reduxjs/toolkit";
// import { Storage, StorageKey } from '../helpers/Storage';
import { getRates } from "./rates/actions";
import { getGasPrices } from "./gasPrices/actions";

// import { setCurrentUser } from './user/actions';
import { walletOperations } from "./walletSlice";
import { userDataOperations } from "./userDataSlice";

const initialState = {
  isLoading: true,
};

const app = createSlice({
  name: "app",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    // setWeb3(state, action) {
    //   state.web3 = action.payload;
    // },
    // setSelectedAddress(state, action) {
    //   state.selectedAddress = action.payload;
    // },
    // setProviderId(state, action) {
    //   state.providerId = action.payload;
    // },
  },
});

export const appActions = app.actions;

const getRoot = (state) => state.app;

export const appSelectors = {
  getLoading: (state) => getRoot(state).isLoading,
  // getWeb3: state => getRoot(state).web3,
  // getSelectedAddress: state => getRoot(state).selectedAddress,
  // getProviderId: state => getRoot(state).providerId,
};

export const appOperations = {
  initApplication: () => async (dispatch, getState) => {
    dispatch(appActions.setLoading(true));
    dispatch(getRates());
    dispatch(getGasPrices());
    dispatch(walletOperations.subscribeEvents());
    dispatch(userDataOperations.userInit());
    await dispatch(walletOperations.initialize());
  },
};

export const appReducer = app.reducer;
