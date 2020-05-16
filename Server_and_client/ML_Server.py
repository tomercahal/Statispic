#For the ML
#from keras.models import load_model
from tensorflow.keras.models import load_model
import numpy as np

# For the rest of the server
import socket
import threading
import sys
import zipfile
import os
import shutil
import tqdm
import gzip
import time
import cv2 as cv
import glob

SEPARATOR = "<SEPARATOR>"  # Used when delivering the file name and file size.


def load_images_for_trained_model(before_images_path, list_of_dirs):
    print(list_of_dirs)
    images = []
    # intialize the images given and prepare them for prediction
    for im_dir in list_of_dirs:
        print(im_dir)
        image = cv.imread(before_images_path + "/" + im_dir)
        # cv.imshow('sample image', image) #for showing the image
        # cv.waitKey(0)
        image = cv.resize(image, (400, 400))
        images.append(image)
    return np.array(images)


class Server (object):
    def __init__(self):
        """The constructor of the Server"""
        self.IP = '127.0.0.1'  # The IP of the server.
        self.PORT = 220  # The chose port to have the connection on
        self.users_allowed = sys.maxsize # This is the amount of users that are allowed to be logged in at the same time
        self.sem = threading.Semaphore(self.users_allowed) #using semaphore in order to handle the threads
        self.ML_model_location = "D:/statispic2/final-statispic_model.hdf5"
        self.ML_model = load_model("D:/statispic2/final-statispic_model.hdf5")  # Loading the ML model
        self.BUFFER_SIZE = 4096  # Senf 4096 bytes each time step
        self.zip_file_extract_dir = "D:/Statispic2/Server_and_client/thread"

    def finish_and_delete(self, dir_to_delete):
        """This function will delete each thread's folder of images when they click on the x and quit the analyze
        mode"""
        # while True:
        #     try:
        #         shutil.rmtree(dir_to_delete)  # Deleting the images directory.
        #         break
        #     except PermissionError as e:
        #         print(e)
        #         time.sleep(0.5)
        # print("I have deleted the necessary directory!")
        self.sem.release()  # Releasing the client after he has gotten his result.

    def predict_on_images_and_send_result(self, client_sock, pic_dir):
        """This function will get the images np array, make the predictions on them.
         Find the best image and return it to the user."""
        dirs_list = []
        for (dirpath, dirnames, filenames) in os.walk(pic_dir):
            dirs_list.extend(filenames)
            break
        print(dirs_list)
        images_ready_for_prediction = load_images_for_trained_model(pic_dir, dirs_list)
        images_ready_for_prediction = images_ready_for_prediction / 255.0  # normalizing

        prediction = self.ML_model.predict(images_ready_for_prediction)  # Predicting the ratios for the images
        print(prediction)
        prediction_mul_list = prediction.tolist()
        prediction_list = [val for sublist in prediction_mul_list for val in sublist]
        print(prediction_list)
        for i in range(len(dirs_list)):
            print("X(image dir)=%s, Predicted value=%s" % (dirs_list[i], prediction[i]))

        best_image_dir = dirs_list[prediction_list.index(max(prediction_list))]
        print("The best image is: " + best_image_dir + " !!!!")

        client_sock.send(best_image_dir[7:].encode())  # Sending the best image to the client

        self.finish_and_delete(pic_dir)  # Going to delete the user's directory

    def recvall(self, client_sock, size):
        received_chunks = []
        buf_size = 4096
        remaining = size
        while remaining > 0:
            received = client_sock.recv(min(remaining, buf_size)).decode()
            if not received:
                raise Exception('unexpected EOF')
            received_chunks.append(received)
            remaining -= len(received)
        return ''.join(received_chunks)

    def recieving_loop(self, client_sock):
        print("In receiving loop!")
        part = b""
        final_parts = []
        start_of_image = b""
        while True:
            received = client_sock.recv(1024)
            if b"\r\n\r\n" in received:
                parts = received.split(b"\r\n\r\n")
                print("Reached image metadata!")
                final_parts.append(part + parts[0])  # Parts[0] should contain a piece of a part
                start_of_image += parts[1]  # Probably going to contain the start of the image data
                break
            # if b"\r\n" in received:
            #     parts = received.split(b"\r\n")
            #     final_parts.append(part + parts[0])
            #     part = parts[1]  # Containing the rest of the message that is a piece of the next part
            else:
                part += received
        print(final_parts)
        parts_again = final_parts[0].split(b"\r\n")
        filesize = parts_again[0].decode()
        filename = parts_again[1].decode()
        print(filesize)
        print(filename)
        return filesize, filename, start_of_image

    def get_images_from_user(self, client_sock, thread_num):
        """This function gets the user input from the user and gets it ready for the ML model to predict on it."""
        print('You are thread number: ' + str(thread_num))
        self.sem.acquire()  # Decreases the users logged in at the time (new thread opened)
        number_of_files = int(client_sock.recv(1024).decode())
        print(f"The number of files that the user is going to send is: {number_of_files}")
        subfolder_name = "thread" + str(thread_num)
        if not os.path.isdir(self.zip_file_extract_dir + str(thread_num)):
            os.mkdir(subfolder_name)  # Create the subfolder
            #time.sleep(2)
        for i in range(number_of_files):
            # receive the file infos
            # receive using client socket, not server socket
            print("Receiving file number " + str(i+1))

            filesize, filename, image_start = self.recieving_loop(client_sock)
            #time.sleep(20)
            # file_dir_length = int(client_sock.recv(self.BUFFER_SIZE).decode("utf-8"))
            # print(file_dir_length)
            # filename = self.recvall(client_sock, file_dir_length)
            # print(filename)
            #
            # filesize = int(client_sock.recv(self.BUFFER_SIZE).decode())

            #received = client_sock.recv(self.BUFFER_SIZE, socket.MSG_WAITALL).decode()
            #print(received)
            #filename, filesize = received.split(SEPARATOR)
            print(filename, filesize, image_start)
            # filename = client_sock.recv(1024)
            # filesize = client_sock.recv(1024)

            # print(filenam, filesiz)
            # try:
            #     filename = filenam.decode("utf-8", "ignore")
            #     filesize = filesiz.decode("utf-8", "ignore")
            # except UnicodeDecodeError:
            #     filename = filenam.decode('utf-16')
            #     filesize = filesiz.decode('utf-16')

            print(f"The user's file is named: {filename} and it's size is: {filesize}")

            # remove absolute path if there is
            filename = os.path.basename(filename)
            print(f"os path basename: {filename}")
            # convert to integer
            filesize = int(filesize)
            file_dir_with_file = self.zip_file_extract_dir + str(thread_num) + "/server_" + filename

            print(f"Stating download for file number {i+1}, the name of it is: {filename}")

            f = open(file_dir_with_file, "wb")
            f.write(image_start)  # image_start containing the start of the image that we have
            total_bytes_recieved = len(image_start)
            how_many_bytes = 1024
            while total_bytes_recieved < filesize:
                if filesize - total_bytes_recieved < 1024:
                    how_many_bytes = filesize - total_bytes_recieved
                data = client_sock.recv(how_many_bytes)
                total_bytes_recieved += len(data)
                f.write(data)
                # print("{0:.2f}".format((totalRecv/float(filesize))*100) + "% done")
            print(f"Finished download for file number {i+1}, the name of it is: {filename}")

        self.predict_on_images_and_send_result(client_sock, self.zip_file_extract_dir + str(thread_num))

    def start(self):
        try:
            print(f"Server starting up on {self.IP} port {self.PORT}")
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

            sock.bind((self.IP, self.PORT))
            sock.listen(1)
            thread_number = 0  # This will be sort of an ID for the thread, used in debugging
            while True:  # Keep accepting as many people that want to help (speed up the process)
                thread_number += 1 #Increasing because of new client
                print('\r\nWaiting for a new client')
                client_socket, client_address = sock.accept()
                print('New client entered!')
                client_socket.sendall('Hello and welcome to Statispic\'s server. '
                                      'We hope we can help you achieve your goals on becoming an'
                                      'instagram star!\r\nCreated by: Tomer Cahal'.encode())
                thread = threading.Thread(target=self.get_images_from_user, args=(client_socket, thread_number))
                thread.start()  # Starting the thread

        except socket.error as e:
            print(e)


if __name__ == '__main__':
    s = Server()
    s.start()

#
# with zipfile.ZipFile(self.local_file_name, 'r') as zip_file:
#     print("Extracting files...")
#     print(zip_file.namelist())
#     for member in zip_file.namelist():
#         print(member)
#         filename = os.path.basename(member)  # Extracting the file name itself from the name
#         print(filename)
#         if not filename:  # Skip directories
#             continue
#         # copy file (taken from zipfiles' extract)
#         source = member  # zip_file.open(member)
#         #target = os.path.join(self.zip_file_extract_dir, filename)
#         target = self.zip_file_extract_dir + "/" + filename
#         print(source, target)
#         with source, target:
#             shutil.copyfile(source, target)
#     print("Done extracting...")