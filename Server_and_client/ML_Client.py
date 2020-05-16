import socket
import zipfile
import numpy as np
import cv2 as cv
import tkinter as tk
from tkinter import filedialog
import tqdm
import os
import time
import sys

my_filetypes = [('Images', '.jpg')] # only jpgs because that's what I download from Instagram and what the ML model expects
zip_name = "images.zip"
SEPARATOR = "<SEPARATOR>"  # Used when delivering the file name and file size.


def zip_file_images(list_of_dirs):
    with zipfile.ZipFile(zip_name, 'w') as file:
        for img_dir in list_of_dirs:
            file.write('{}'.format(img_dir))
    return


def load_images_for_trained_model(list_of_dirs):
    # initialize our images array (i.e., the house images themselves)
    images = []

    # loop over the indexes of the houses
    for im_dir in list_of_dirs:
        #  print(im_dir)
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

    def send_to_server_and_get_response(self, list_of_dirs):
        amount_of_dirs = str(len(list_of_dirs)).encode()
        self.sock.send(amount_of_dirs)  # Sending the server the amount of files that he will be receiving
        #  print("Started sending the files to the server!")
        for file_dir in list_of_dirs:
            #  print(f"Started sending {file_dir} to the server! ")
            filesize = os.path.getsize(file_dir)
            #  print(f"{file_dir}{SEPARATOR}{filesize}".encode())
            # sending = file_dir + SEPARATOR + str(filesize)
            # print(sending)
            # self.sock.sendall(sending.encode())

            # self.sock.sendall(str(filesize).encode())  # The actual image size
            # self.sock.sendall(file_dir.encode())
            # with open(file_dir, "rb") as f:
            #     all_of_the_file = f.read()
            # self.sock.sendall(("\r\n\r\n").encode())  # Marking that we finished sending
            # self.sock.sendall(all_of_the_file)  # Already binary
            print("Started sending for: " + file_dir)
            self.sock.sendall((str(filesize) + "\r\n").encode())  # The actual image size
            self.sock.sendall((file_dir).encode())
            with open(file_dir, "rb") as f:
                all_of_the_file = f.read()
            self.sock.sendall(("\r\n\r\n").encode())  # Marking that we finished sending
            self.sock.sendall(all_of_the_file)  # Already binary
            print("Finished sending for: " + file_dir)

            # print(filesize, file_dir)
            # print(str(len(file_dir)).encode())
            # self.sock.sendall(str(len(file_dir)).encode())
            # self.sock.sendall(file_dir.encode())
            # self.sock.sendall(str(filesize).encode())
            # with open(file_dir, "rb") as f:
            #     all_of_the_file = f.read()
            # self.sock.sendall(all_of_the_file)  # Already binary

            #print(filesize)
            # self.sock.sendall(file_dir.encode())
            # time.sleep(0.5)
            # self.sock.sendall(str(filesize).encode())

            ##  print(sending.encode()[38:40])
            #self.sock.send(sending.encode(encoding='UTF-8')) # Sending the file name and size to the server
            # with open(file_dir, "rb") as f:
            #     bytesToSend = f.read(1024)
            #     totalBytes = 1024
            #     self.sock.send(bytesToSend)
            #     while totalBytes < filesize:
            #         bytesToSend = f.read(1024)
            #         totalBytes += 1024
            #         #  print(totalBytes)
            #         self.sock.send(bytesToSend)
            #  print(f"Finished sending {file_dir} to the server! ")
            #self.sock.send("finished")
        #  print("Finished sending the files to the server!")

        best_image = self.sock.recv(1024).decode()
        best_image_dir = self.dir_photos_taken + "/" + best_image
        #sys.stdout.write(f"The best image predicted by the server is: {best_image_dir}")  # Back to c#
        sys.stdout.write(best_image_dir)  # Back to c#
        # image = cv.imread(best_image_dir)
        # cv.imshow('sample image', image) #for showing the image
        # cv.waitKey(0)

    def get_images_dirs(self):
        root = tk.Tk()
        root.iconbitmap(bitmap=self.statispic_favicon)
        root.withdraw()

        file_paths = filedialog.askopenfilenames(title="Please choose one or more pictures", filetypes=my_filetypes)
        print(file_paths)
        self.dir_photos_taken = os.path.dirname(file_paths[0])
        #self.zip_file_images(file_paths)
        self.send_to_server_and_get_response(file_paths)

    def start(self):
        """Sort of like the main function, it binds a socket connection to the server, and then calls another function to
        send the images to the server."""
        try:
            #  print('connecting to IP %s PORT %s' % (self.IP, self.PORT))
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM) # Create a TCP/IP socket
            self.sock.connect((self.IP, self.PORT))

            #  print('Connected to server!')
            msg = self.sock.recv(1024)  # The initial server message
            #  print(msg.decode())
            self.get_images_dirs()
        except socket.error as e:
            #  print(e)
            self.sock.close()


if __name__ == '__main__':
    c = Client()
    c.start()
