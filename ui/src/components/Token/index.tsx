import { Box, Button } from '@material-ui/core'
import { Form, Formik, FormikHelpers } from 'formik'
import { setTokenName, setTokens } from 'slices/globalStatus'
import { useStoreDispatch, useStoreSelector } from 'store'

import React from 'react'
import T from 'components/T'
import { TextField } from 'components/FormField'
import api from 'api'
import { setAlert } from 'slices/globalStatus'
import { useIntl } from 'react-intl'

function validateName(value: string) {
  let error

  if (value === '') {
    error = (T('settings.addToken.nameValidation') as unknown) as string
  }

  return error
}

function validateToken(value: string) {
  let error

  if (value === '') {
    error = (T('settings.addToken.tokenValidation') as unknown) as string
  }

  return error
}

export interface TokenFormValues {
  name: string
  token: string
}

interface TokenProps {
  onSubmitCallback?: (values: TokenFormValues) => void
}

const Token: React.FC<TokenProps> = ({ onSubmitCallback }) => {
  const intl = useIntl()

  const { tokens } = useStoreSelector((state) => state.globalStatus)
  const dispatch = useStoreDispatch()

  const saveToken = (values: TokenFormValues) => {
    dispatch(setTokens([...tokens, values]))
    dispatch(setTokenName(values.name))
  }

  const submitToken = (values: TokenFormValues, { setFieldError, resetForm }: FormikHelpers<TokenFormValues>) => {
    if (tokens.some((token) => token.name === values.name)) {
      dispatch(
        setAlert({
          type: 'warning',
          message: intl.formatMessage({ id: 'settings.addToken.duplicateDesc' }),
        })
      )

      return
    }

    api.auth.token(values.token)

    function restSteps() {
      saveToken(values)

      typeof onSubmitCallback === 'function' && onSubmitCallback(values)

      resetForm()
    }

    // Test the validity of the token in advance
    api.experiments
      .state()
      .then(restSteps)
      .catch((error) => {
        const data = error.response?.data

        if (data && data.code === 'error.api.invalid_request' && data.message.includes('Unauthorized')) {
          setFieldError('token', 'Please check the validity of the token')

          api.auth.resetToken()

          return
        }

        restSteps()
      })
  }

  return (
    <Formik initialValues={{ name: '', token: '' }} onSubmit={submitToken}>
      {({ errors, touched }) => (
        <Form>
          <TextField
            name="name"
            label={T('settings.addToken.name')}
            validate={validateName}
            helperText={errors.name && touched.name ? errors.name : T('settings.addToken.nameHelper')}
            error={errors.name && touched.name ? true : false}
          />
          <TextField
            name="token"
            label={T('settings.addToken.token')}
            multiline
            rows={12}
            validate={validateToken}
            helperText={errors.token && touched.token ? errors.token : T('settings.addToken.tokenHelper')}
            error={errors.token && touched.token ? true : false}
          />
          <Box textAlign="right">
            <Button type="submit" variant="contained" color="primary">
              {T('common.submit')}
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  )
}

export default Token
