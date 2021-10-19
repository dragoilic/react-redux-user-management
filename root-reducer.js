import { combineReducers } from "redux";
import { appReducer } from "./appSlice";
import alertReducer from "./alert/reducers";
import billingReducer from "./billing/reducers";
import discoveryReducer from "./discovery/reducers";
import ratesReducer from "./rates/reducers";
import gasReducer from "./gasPrices/reducers";
import userReducer from "./user/reducers";
import transactionReducer from "./transactionManager/reducers";

import { walletReducer } from "./walletSlice";
import { userDataReducer } from "./userDataSlice";
import { liquidityReducer } from "./liquiditySlice";
import { stakingReducer } from "./stakingSlice";
import { newsReducer } from "./newsSlice";

export default combineReducers({
  user: userReducer,
  userData: userDataReducer,
  alert: alertReducer,
  billing: billingReducer,
  tokens: discoveryReducer,
  liquidity: liquidityReducer,
  staking: stakingReducer,
  rates: ratesReducer,
  wallet: walletReducer,
  app: appReducer,
  transactions: transactionReducer,
  gas: gasReducer,
  news: newsReducer,
});
