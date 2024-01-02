export const formValidators = {
    notEmptyValidator: {
        validate: (value) => {
            return value.trim().length > 0;
        },
        message: "The field cannot be empty"
    },

}