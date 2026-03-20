import Runtime "mo:core/Runtime";

actor {
  let defaultTitle = "🎉 Happy Birthday Website! 🎉";
  var customTitle : ?Text = null;
  var customMessage : ?Text = null;

  public shared ({ caller }) func setTitle(newTitle : Text) : async () {
    customTitle := ?newTitle;
  };

  public shared ({ caller }) func setBirthdayMessage(message : Text) : async () {
    customMessage := ?message;
  };

  public shared ({ caller }) func resetTitle() : async () {
    customTitle := null;
  };

  public shared ({ caller }) func resetBirthdayMessage() : async () {
    customMessage := null;
  };

  public query ({ caller }) func getTitle() : async Text {
    switch (customTitle) {
      case (?title) { title };
      case (null) { defaultTitle };
    };
  };

  public query ({ caller }) func getBirthdayMessage() : async Text {
    switch (customMessage) {
      case (?message) { message };
      case (null) { Runtime.trap("No birthday message set.") };
    };
  };
};
