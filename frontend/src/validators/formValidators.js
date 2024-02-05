export const formValidators = {
    notEmptyValidator: {
        validate: (value) => {
            return value.trim().length > 0;
        },
        message: "The field cannot be empty"
    },
    notNoneTypeValidator: {
        validate: (value) => {
            return value !== "None";
        },
        message: "Please, select a type"
    },

    date: {
        validate: (value) => {
            let year = new Date().getFullYear()
            return value !== "None" && value> year-100 && value<=year;
        },
        message: "Please, write a date beetwen "+ (new Date().getFullYear()-100) + " and " + new Date().getFullYear()
    }


}