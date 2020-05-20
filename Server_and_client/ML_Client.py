import socket
import zipfile
import numpy as np
import cv2 as cv
import tkinter as tk
from tkinter import filedialog
from tkinter import messagebox
import os
import sys
from cryptography.fernet import Fernet  # Used to create a key, encrypt and decrypt messages

my_filetypes = [('Images', '.jpg')] # only jpgs because that's what I download from Instagram and what the ML model expects
zip_name = "images.zip"  # Used when trying to send to the server as a zip file.
SEPARATOR = "<SEPARATOR>"  # Used when delivering the file name and file size.


def zip_file_images(list_of_dirs):
    """This function is used to create a zip file from paths to images. Currently this method is not in use
    because I am solely using sockets to send the files from the client to the server."""
    with zipfile.ZipFile(zip_name, 'w') as file:
        for img_dir in list_of_dirs:
            file.write('{}'.format(img_dir))
    return


def load_images_for_trained_model(list_of_dirs):
    """This function is the same function used to manipulate the images to get them ready for prediction.
    Currently not using this method to send over the files because it is big and hard to handel."""
    # initialize our images array (i.e., the house images themselves)
    images = []

    # loop over the indexes of the houses
    for im_dir in list_of_dirs:
        image = cv.imread(im_dir)
        image = cv.resize(image, (400, 400))  # Try this for better results
        # cv.imshow('sample image', image) #for showing the image
        # cv.waitKey(0)
        images.append(image)

    # return our set of images
    return np.array(images)


class Client(object):

    def __init__(self):
        """The constructor of the Client class"""
        self.IP = '127.0.0.1'  # The Ip of the client.
        self.PORT = 220  # The port of the client.
        self.sock = None  # Will include the socket information
        self.BUFFER_SIZE = 4096  # Send 4096 bytes each time step
        self.dir_photos_taken = "D:/Statispic2/Photos"  # Have to change to be where the user selected from
        self.statispic_favicon = "D:/Statispic2/favicon.ico"  # Where the favicon is saved
        self.encrypt_key_path = "D:/Statispic2/Server_and_client/key.key"  # Where the key is located at
        self.encryption_key = self.read_key()  # Getting the encryption key from the key file
        self.encryptor = Fernet(self.encryption_key)  # Initializing the Fernet with the key

    def read_key(self):
        """A function that reads the the key from the self.encrypt_key_path and returns it"""
        with open(self.encrypt_key_path, "rb") as file:
            return file.read()  # Returning the key

    def send_to_server_and_get_response(self, list_of_dirs):
        amount_of_dirs = str(len(list_of_dirs)).encode()
        self.sock.send(amount_of_dirs)  # Sending the server the amount of files that he will be receiving
        print("Started sending the files to the server!")
        for file_dir in list_of_dirs:
            print(f"Started sending {file_dir} to the server! ")
            filesize = os.path.getsize(file_dir)  # Getting the size of the actual image file in bytes!

            print("Started sending for: " + file_dir)
            #filesize_and_break = (str(filesize) + "\r\n").encode()  # contains the size then a seprator (\r\n)
            filedir_to_image_big_break = (file_dir + "\r\n\r\n").encode()  # The one that is going to be in the metadata
            with open(file_dir, "rb") as f:
                all_of_the_file = f.read()  # Getting the file already binary

            metadata = filedir_to_image_big_break + all_of_the_file  # Complete metadata
            encrypted_metadata = self.encryptor.encrypt(metadata)  # The encrypted metadata
            size_of_encrypted_metadata = str(len(encrypted_metadata)).encode()  # The length of the encrypted metadata
            print(size_of_encrypted_metadata)

            self.sock.sendall(size_of_encrypted_metadata + "\r\n".encode())  # Sending the size of the metadata + split
            self.sock.sendall(encrypted_metadata)  # Sending the encrypted metadata to the server.

            print("Finished sending for: " + file_dir)

            print(f"Finished sending {file_dir} to the server! ")
        print("Finished sending ALL of the files to the server!")

        best_image = self.sock.recv(1024).decode()  # This will contain the basename only
        best_image_dir = self.dir_photos_taken + "/" + best_image  # Creating the full path
        print(f"The best image predicted by the server is: {best_image_dir}")  # Back to c#
        sys.stdout.write(best_image_dir)  # Back to C#
        image = cv.imread(best_image_dir)
        cv.imshow('sample image', image) #for showing the image
        cv.waitKey(0)

    def get_images_dirs(self):
        """This function opens a dialog box (file explorer), the user picks which images he would like to
        check. In this function the user must pick file paths or else he will get eror messages. Then this function
        calls send_to_server_and_get_response."""
        root = tk.Tk()
        root.iconbitmap(bitmap=self.statispic_favicon)  # Selecting statispic's logo as the favicon
        root.withdraw()
        file_paths = filedialog.askopenfilenames(title="Please choose one or more pictures", filetypes=my_filetypes)
        while file_paths == "":  # Checking if the user has pressed the x button and did not choose photos
            messagebox.showerror(title="You gotta chose some images!", message="ERROR, you did not pick any images! " +
                                                                               "I'll give you one more chance!")
            file_paths = filedialog.askopenfilenames(title="Please choose one or more pictures", filetypes=my_filetypes)
        print(file_paths)  # The file paths to the images that the user picked
        self.dir_photos_taken = os.path.dirname(file_paths[0])  # Checking which directory the images were from.
        self.send_to_server_and_get_response(file_paths)  # Calling the next function with the paths as argument.

    def start(self):
        """Sort of like the main function, it binds a socket connection to the server, and then calls another function to
        send the images to the server."""
        try:
            print(self.encryption_key)
            print('connecting to IP %s PORT %s' % (self.IP, self.PORT))
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM) # Create a TCP/IP socket
            self.sock.connect((self.IP, self.PORT))  # Connecting to the server

            print('Connected to server!')
            msg = self.sock.recv(1024)  # The initial server message
            print(msg.decode())
            self.get_images_dirs()  # Getting the image paths from the user
        except socket.error as e:
            print(e)
            self.sock.close()


if __name__ == '__main__':
    c = Client()
    c.start()
