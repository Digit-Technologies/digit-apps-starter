import InputLabel from "@mui/material/InputLabel"
import { styled } from "@mui/material/styles"

import { neutral, stone } from "../theme/colors"

const Label = styled(InputLabel)(({ theme }) => ({
  color: stone[950],
  marginBottom: theme.spacing(0.5),
  ...theme.typography.subtitle2,
  ...theme.applyStyles("dark", {
    color: neutral.white,
  }),
}))

export default Label
