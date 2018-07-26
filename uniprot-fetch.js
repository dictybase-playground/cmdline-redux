import { createStore, combineReducers, applyMiddleware } from "redux"
import path from "path"
import thunk from "redux-thunk"
import fetch from "node-fetch"
import dayjs from "dayjs"

const uniprotTypes = {
  FETCH_UNIPROT_REQUEST: "FETCH_UNIPROT_REQUEST",
  FETCH_UNIPROT_SUCCESS: "FETCH_UNIPROT_SUCCESS",
  FETCH_UNIPROT_FAILURE: "FETCH_UNIPROT_FAILURE",
}

const makeUniprotURL = id => {
  return `https://www.uniprot.org/uniprot?query=gene:${id}&columns=id&format=list`
}

const fetchUniprotRequest = id => {
  return {
    type: uniprotTypes.FETCH_UNIPROT_REQUEST,
    payload: {
      isFetching: true,
      id,
    },
  }
}

const fetchUniprotFailure = error => {
  return {
    type: uniprotTypes.FETCH_UNIPROT_FAILURE,
    payload: {
      isFetching: false,
      error: error,
    },
  }
}

const fetchUniprotSuccess = (id, uniprotId) => {
  return {
    type: uniprotTypes.FETCH_UNIPROT_SUCCESS,
    payload: {
      isFetching: false,
      id,
      uniprotId,
    },
  }
}

const geneId2Uniprot = id => {
  return async dispatch => {
    dispatch(fetchUniprotRequest(id))
    try {
      const res = await fetch(makeUniprotURL(id))
      if (res.ok) {
        if (res.headers.get("content-length") > 0) {
          const uniprotId = await res.text()
          dispatch(fetchUniprotSuccess(id, uniprotId.trim()))
        } else {
          dispatch(fetchUniprotFailure(`no uniprot id for ${id}`))
        }
      } else {
        dispatch(fetchUniprotFailure(res.statusText))
      }
    } catch (error) {
      dispatch(fetchUniprotFailure(error.message))
    }
  }
}

const uniProtReducer = (state = {}, action) => {
  console.log(
    "%s reducer called with state %o and action %s",
    dayjs().format("ddd MMM D YYYY h:mm:ss"),
    state,
    action.type,
  )

  switch (action.type) {
    case uniprotTypes.FETCH_UNIPROT_REQUEST:
    case uniprotTypes.FETCH_UNIPROT_SUCCESS:
    case uniprotTypes.FETCH_UNIPROT_FAILURE:
      return { ...state, ...action.payload }
    default:
      return state
  }
}

const runner = geneId => {
  const store = createStore(
    combineReducers({ uniprot: uniProtReducer }),
    applyMiddleware(thunk),
  )

  store.dispatch(geneId2Uniprot(geneId))
  console.log(
    "%s %s %o",
    dayjs().format("ddd MMM D YYYY h:mm:ss"),
    "state after sending gene id",
    store.getState(),
  )

  setTimeout(() => {
    console.log(
      "%s new state %o",
      dayjs().format("ddd MMM D YYYY h:mm:ss"),
      store.getState(),
    )
  }, 2000)
}

if (process.argv.length <= 2) {
  console.error(
    "need a gene id\n%s %s",
    path.basename(process.argv[1]),
    "<gene-id>",
  )
  process.exit(-1)
}
runner(process.argv[2])
