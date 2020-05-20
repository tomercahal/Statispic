import tkinter as tk
from tkinter import filedialog
from tkinter import messagebox
#
# # Build a list of tuples for each file type the file dialog should display
# my_filetypes = [('Images', '.jpg')]# only jpgs because that's what I download from Instagram and what the ML model expects
#
# root = tk.Tk()
# root.withdraw()
#
# file_paths = filedialog.askopenfilenames(title="Please choose one or more pictures", filetypes=my_filetypes)
# print(file_paths)

# import os
#
# os.makedirs("big boi")
import glob
#
# pic_dir = "D:/Statispic2/Server_and_client/thread1"
# dirs_list = glob.glob(pic_dir + "/*.jpg")
# print(dirs_list)
#
# from os import walk
#
# f = []
# for (dirpath, dirnames, filenames) in walk("D:/Statispic2/Server_and_client/thread1"):
#     f.extend(filenames)
#     break
# print(f)
#
# import shutil
#
# shutil.rmtree("D:/Statispic2/Server_and_client/thread1")
#
# my_filetypes = [('Images', '.jpg')] # only jpgs because that's what I download from Instagram and what the ML model expects
# root = tk.Tk()
# root.iconbitmap(bitmap="D:/Statispic2/favicon.ico")
# root.withdraw()
#
# file_paths = filedialog.askopenfilenames(title="Please choose one or more pictures", filetypes=my_filetypes)
# while file_paths == "":
#     messagebox.showerror(title="You gotta chose some images!", message="ERROR, you did not pick any images! " +
#                          "I'll give you one more chance!")
#     file_paths = filedialog.askopenfilenames(title="Please choose one or more pictures", filetypes=my_filetypes)
# print(file_paths)

import cryptography


from cryptography.fernet import Fernet  # Used to create a key

key = Fernet.generate_key()  # Generating a random key
print(key)
with open("key.key", "wb") as file:
    file.write(key)  # The key is type bytes still

def read_key():
    with open("key.key", "rb") as file:
        return file.read()


# key = read_key()
# f = Fernet(key)
# message = "cool encrypted message!".encode()  # Encode the message
# yo_sick_man = " yo sick man".encode()
# encrypted = f.encrypt(message + yo_sick_man)
# decrypted = f.decrypt(encrypted).decode()
# print(decrypted)

# Encrypting the message
# key = read_key()  # Getting the key from key.key file
# # print(key)
# f = Fernet(key)
# print(f)
# encrypted = f.encrypt(message)
# print(encrypted)
#
# # Decrypting the message
# f = Fernet(key)
# decrypted = f.decrypt(encrypted)
# print(decrypted)


