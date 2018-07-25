import { createStore, combineReducers, applyMiddleware } from "redux"

const save = ({ key, namespace }) => {
  return store => {
    return next => {
      return action => {
        const state = store.getState()
        console.log(
          "middleware got state %s to store %s with namespace %s",
          JSON.stringify(state),
          key,
          namespace,
        )
        return next(action)
      }
    }
  }
}

const setNameActionCreator = name => {
  return {
    type: "SET_NAME",
    name: name,
  }
}

const hydrateName = name => {
  return {
    type: "HYDRATE_NAME",
    name: name,
  }
}

const userReducer = (state = {}, action) => {
  switch (action.type) {
    case "SET_NAME":
      return {
        ...state,
        name: action.name,
      }
    default:
      return state
  }
}

const hydrateReducer = (state = {}, action) => {
  switch (action.type) {
    case "HYDRATE_NAME":
      return {
        ...state,
        name: action.name,
        description: action.name.toUpperCase(),
      }
    default:
      return state
  }
}

const itemsReducer = (state = [], action) => {
  switch (action.type) {
    case "ADD_ITEM":
      return [...state, action.item]
    default:
      return state
  }
}

const reducer = combineReducers({
  user: userReducer,
  items: itemsReducer,
  hydrate: hydrateReducer,
})

//const store = createStore(reducer)
//console.log('store state after initialization:', store.getState())
//store.dispatch(setNameActionCreator("bob"))
//console.log('store user:', store.getState().user)
//store.dispatch(hydrateName("tucker"))
//console.log('store user:', store.getState().user)
//

const store_0 = createStore(
  reducer,
  applyMiddleware(save({ key: "user", namespace: "user" })),
)
console.log("store_0 state after initialization:", store_0.getState())
store_0.dispatch({ type: "AN_ACTION" })
console.log("store_0 state after action AN_ACTION:", store_0.getState())
store_0.dispatch(setNameActionCreator("bob"))
console.log("store_0 state after action SET_NAME:", store_0.getState())
store_0.dispatch(hydrateName("tucker"))
console.log("store_0 state after action HYDRATE_NAME:", store_0.getState())
