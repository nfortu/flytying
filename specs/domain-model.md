FlyTying is a fly fishing fly tying platform to find fly patterns, share knowledge and find which fly to use when and where. In this document we describe app domain and data model. 

# Fly Tying domain

## Base

- Fly
-- hook_model (Hook)
-- hook_size (size range)
-- pictures [url1, url2]

- FlyType
-- name: (string)
-- details (string)
- Dry (FlyType)
- Wet  (FlyType)
- Emerger (FlyType)
- Nymph (FlyType)
- Streamer (FlyType)

- Hook
-- model
-- brand
-- intended_for [FlyType]
-- details
-- sizes [4,5,6,7,8,9,10]

## Materials

- Material
-- category 
-- name
-- details
-- brand []

# Static types

Types
-- brand [Hareline, MFC, Whiting]
-- flyCategory [dry, wet, emerger, nymph, streamer]
-- materialCategory [feathers, hair, thread, fiebrs, beadheads, eyes]
