import FormHelperText from "@mui/material/FormHelperText"
import { styled } from "@mui/material/styles"

const HelperText = styled(FormHelperText)(({ theme }) => ({
  color: "#616161",
  fontSize: "12px",
  fontWeight: "normal",
  lineHeight: "130%" /* 15.6px */,
  marginTop: 0,
  marginBottom: "8px",
  ...theme.applyStyles("dark", {
    color: theme.palette.primary.light,
  }),
}))

export default HelperText
