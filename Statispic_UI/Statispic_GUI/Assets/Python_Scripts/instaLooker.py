import webbrowser
import sys
from win10toast import ToastNotifier


statispic_favicon_path = "D:/Statispic/favicon.ico"  # Where the favicon is located at
profileName = sys.argv[1]  # Getting the username from the cmd command.
# profileName = "statispic"  # For test running just as a script
webbrowser.open("https://www.instagram.com/" + profileName, new=0)  # Opening a new tab in the web browser
toaster = ToastNotifier()  # Creating a toast instance
toaster.show_toast("Showing now!", "Opening up " + profileName + "'s Instagram profile in your browser.",
                   icon_path=statispic_favicon_path, duration=10)  # Showing the toast to the user.
