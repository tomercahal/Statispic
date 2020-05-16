import webbrowser
import sys
from win10toast import ToastNotifier


statispic_favicon_path = "D:/Statispic2/favicon.ico"
#profileName = sys.argv[1]
profileName = "tomercahal"
webbrowser.open("https://www.instagram.com/" + profileName, new=0)
toaster = ToastNotifier()
toaster.show_toast("Showing now!", "Opening up " + profileName + "'s Instagram profile in your browser.",
                   icon_path=statispic_favicon_path, duration=3)
