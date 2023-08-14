//bracket notation [] only used because of the dash in the route
exports["invite-mailto"] = async (req, res) => {
    const {first_name, last_name, email} = req.body;
    //1 is a dummy id for now, shouldn't affect integration testing
    let mailto = await createInviteEmail(first_name, last_name, email, 1);
    res.send(mailto);
  };