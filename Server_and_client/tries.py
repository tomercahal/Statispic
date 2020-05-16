import tkinter as tk
from tkinter import filedialog
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

my_filetypes = [('Images', '.jpg')] # only jpgs because that's what I download from Instagram and what the ML model expects
root = tk.Tk()
root.iconbitmap(bitmap="D:/Statispic2/favicon.ico")
root.withdraw()

file_paths = filedialog.askopenfilenames(title="Please choose one or more pictures", filetypes=my_filetypes)
