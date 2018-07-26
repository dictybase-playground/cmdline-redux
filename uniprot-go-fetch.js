import { createStore, combineReducers, applyMiddleware } from "redux"
import path from "path"
import util from "util"
import thunk from "redux-thunk"
import fetch from "node-fetch"
import dayjs from "dayjs"

const uniprotTypes = {
  FETCH_UNIPROT_REQUEST: "FETCH_UNIPROT_REQUEST",
  FETCH_UNIPROT_SUCCESS: "FETCH_UNIPROT_SUCCESS",
  FETCH_UNIPROT_FAILURE: "FETCH_UNIPROT_FAILURE",
}

const goaTypes = {
  FETCH_GOA_REQUEST: "FETCH_GOA_REQUEST",
  FETCH_GOA_SUCCESS: "FETCH_GOA_SUCCESS",
  FETCH_GOA_FAILURE: "FETCH_GOA_FAILURE",
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

const makeGoaURL = id => {
  const base = "https://www.ebi.ac.uk/QuickGO/services/annotation/search?"
  const query = "includeFields=goName&limit=100&geneProductId="
  return `${base}${query}${id}`
}

const fetchGoaRequest = id => {
  return {
    type: goaTypes.FETCH_GOA_REQUEST,
    payload: {
      isFetching: true,
      id,
    },
  }
}

const fetchGoaFailure = error => {
  return {
    type: goaTypes.FETCH_GOA_FAILURE,
    payload: {
      isFetching: false,
      error: error,
    },
  }
}

const fetchGoaSuccess = goaResp => {
  return {
    type: goaTypes.FETCH_GOA_SUCCESS,
    payload: {
      isFetching: false,
      goa: normalizeGoa(goaResp),
    },
  }
}

const normalizeGoa = goaResp => {
  if (goaResp.numberOfHits == 0) {
    return { data: [] }
  }
  return {
    data: goaResp.results.map(r => {
      return {
        type: r.goAspect,
        id: r.goId,
        attributes: {
          date: r.date,
          evidence_code: r.goEvidence,
          goterm: r.goName,
          qualifier: r.qualifier,
          publication: r.reference,
          with: r.withFrom,
          extensions: r.extensions,
          assigned_by: r.assignedBy,
        },
      }
    }),
  }
}

const fetchGoa = id => {
  return async dispatch => {
    dispatch(fetchGoaRequest(id))
    const res = await fetch(makeGoaURL(id), {
      headers: { Accept: "application/json" },
    })
    if (res.ok) {
      const json = await res.json()
      dispatch(fetchGoaSuccess(json))
    } else {
      dispatch(fetchGoaFailure(res.statusText))
    }
  }
}

const goaReducer = (state = {}, action) => {
  console.log(
    "%s reducer called with state %o and action %s",
    dayjs().format("ddd MMM D YYYY h:mm:ss"),
    state,
    action.type,
  )

  switch (action.type) {
    case goaTypes.FETCH_GOA_REQUEST:
    case goaTypes.FETCH_GOA_SUCCESS:
    case goaTypes.FETCH_GOA_FAILURE:
      return { ...state, ...action.payload }
    default:
      return state
  }
}

const gene2Goa = id => {
  return async (dispatch, getState) => {
    try {
      await dispatch(geneId2Uniprot(id))
      const { uniprot } = getState()
      if (uniprot.uniprotId) {
        await dispatch(fetchGoa(uniprot.uniprotId))
      }
    } catch (error) {
      dispatch(fetchGoaFailure(error.message))
    }
  }
}

const runner = geneId => {
  const store = createStore(
    combineReducers({ uniprot: uniProtReducer, goa: goaReducer }),
    applyMiddleware(thunk),
  )

  store.dispatch(gene2Goa(geneId))
  console.log(
    "%s %s %o",
    dayjs().format("ddd MMM D YYYY h:mm:ss"),
    "state after sending gene id",
    store.getState(),
  )

  setTimeout(() => {
    console.log(
      "%s new state %s",
      dayjs().format("ddd MMM D YYYY h:mm:ss"),
      util.inspect(store.getState(), { depth: 12 }),
    )
  }, 3000)
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
