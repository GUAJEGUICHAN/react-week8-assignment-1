import { createSlice } from '@reduxjs/toolkit';

import { equal } from './utils';

import {
  fetchRestaurants,
  fetchRestaurant,
  postLogin,
  postReview,
  fetchRegions,
  fetchCategories,
} from './services/api';

import { saveItem } from './services/storage';

const initialReviewFields = {
  score: '',
  description: '',
};

const { actions, reducer } = createSlice({
  name: 'application',
  initialState: {
    regions: [],
    categories: [],
    restaurants: [],
    restaurant: null,
    selectedRegion: null,
    selectedCategory: null,
    loginFields: {
      email: '',
      password: '',
    },
    accessToken: '',
    reviewFields: {
      ...initialReviewFields,
    },
  },
  reducers: {
    setRegions: (state, { payload: regions }) => ({ ...state, regions }),

    setCategories: (state, { payload: categories }) => ({ ...state, categories }),

    setRegionsAndCategories: (state, { payload: { regions, categories } }) => ({
      ...state,
      regions,
      categories,
    }),

    setRestaurants: (state, { payload: restaurants }) => ({ ...state, restaurants }),

    setRestaurant: (state, { payload: restaurant }) => ({ ...state, restaurant }),

    selectRegion: (state, { payload: regionId }) => ({
      ...state,
      selectedRegion: state.regions.find(equal('id', regionId)),
    }),

    selectCategory: (state, { payload: categoryId }) => ({
      ...state,
      selectedCategory: state.categories.find(equal('id', categoryId)),
    }),

    changeLoginField: (state, { payload: { name, value } }) => ({
      ...state,
      loginFields: {
        ...state.loginFields,
        [name]: value,
      },
    }),

    setAccessToken: (state, { payload: accessToken }) => ({
      ...state,
      accessToken,
    }),

    logout: (state) => ({
      ...state,
      accessToken: '',
    }),

    changeReviewField: (state, { payload: { name, value } }) => ({
      ...state,
      reviewFields: {
        ...state.reviewFields,
        [name]: value,
      },
    }),

    clearReviewFields: (state) => ({
      ...state,
      reviewFields: {
        ...initialReviewFields,
      },
    }),

    setReviews: (state, { payload: reviews }) => ({
      ...state,
      restaurant: {
        ...state.restaurant,
        reviews,
      },
    }),
  },
});

export const {
  setRegions,
  setCategories,
  setRegionsAndCategories,
  setRestaurants,
  setRestaurant,
  selectRegion,
  selectCategory,
  changeLoginField,
  setAccessToken,
  logout,
  changeReviewField,
  clearReviewFields,
  setReviews,
} = actions;

export function loadInitialData() {
  return async (dispatch) => {
    const [regions, categories] = await Promise.all([fetchRegions(), fetchCategories()]);
    dispatch(setRegionsAndCategories({ regions, categories }));
  };
}

export function loadRestaurants() {
  return async (dispatch, getState) => {
    const {
      selectedRegion: region,
      selectedCategory: category,
    } = getState();

    if (!region || !category) {
      return;
    }

    try {
      const restaurants = await fetchRestaurants({
        regionName: region.name,
        categoryId: category.id,
      });

      dispatch(setRestaurants(restaurants));
    } catch (error) {
      dispatch(setRestaurants([]));
    }
  };
}

export function loadRestaurant({ restaurantId }) {
  return async (dispatch) => {
    dispatch(setRestaurant(null));
    try {
      const restaurant = await fetchRestaurant({ restaurantId });

      dispatch(setRestaurant(restaurant));
    } catch (error) {
      dispatch(setRestaurant({}));
    }
  };
}

export function requestLogin() {
  return async (dispatch, getState) => {
    const { loginFields: { email, password } } = getState();
    try {
      const accessToken = await postLogin({ email, password });

      saveItem('accessToken', accessToken);

      dispatch(setAccessToken(accessToken));
    } catch (error) {
      dispatch(setAccessToken(''));
    }
  };
}

export function loadReview({ restaurantId }) {
  return async (dispatch) => {
    try {
      const restaurant = await fetchRestaurant({ restaurantId });

      dispatch(setReviews(restaurant.reviews));
    } catch (error) {
      dispatch(setReviews([]));
    }
  };
}

export function sendReview({ restaurantId }) {
  return async (dispatch, getState) => {
    const { accessToken, reviewFields: { score, description } } = getState();

    try {
      await postReview({
        accessToken, restaurantId, score, description,
      });

      dispatch(loadReview({ restaurantId }));

      dispatch(clearReviewFields());
    } catch (error) {
      dispatch(clearReviewFields());
    }
  };
}

export default reducer;
