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
import cv2 as cv
from cryptography.fernet import Fernet  # Used to create a key, encrypt and decrypt messages

SEPARATOR = "<SEPARATOR>"  # Used when delivering the file name and file size.


def load_images_for_trained_model(before_images_path, list_of_dirs):
    """This function is the same function used to manipulate the images to get them ready for prediction.
    The function receives the path before the images names, and a list of just the basename of the images, for
    example (photo1.jpg).After the server has the images from the user he will use this function in order
    to prepare the images for prediction."""
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
        self.sem = threading.Semaphore(self.users_allowed)  # using semaphore in order to handle the threads
        self.ML_model_location = "D:/statispic2/final-statispic_model.hdf5"
        self.ML_model = load_model("D:/statispic2/final-statispic_model.hdf5")  # Loading the ML model
        self.server_file_extract_dir = "D:/Statispic2/Server_and_client/thread"
        self.encrypt_key_path = "D:/Statispic2/Server_and_client/key.key"  # Where the key is located at
        self.encryption_key = self.read_key()  # Getting the encryption key from the key file
        self.decryptor = Fernet(self.encryption_key)  # Initializing the Fernet with the key

    def read_key(self):
        """A function that reads the the key from the self.encrypt_key_path and returns it"""
        with open(self.encrypt_key_path, "rb") as file:
            return file.read()  # Returning the key

    def predict_on_images_and_send_result(self, client_sock, pic_dir):
        """This function will get the images np array, make the predictions on them.
         Find the best image, return it to the user and release the thread."""
        dirs_list = []  # This list will contain the directories of the images for prediction
        for (dirpath, dirnames, filenames) in os.walk(pic_dir):
            dirs_list.extend(filenames)
            break
        print("The images that the predictions are going to be on are:")
        print(dirs_list)
        images_ready_for_prediction = load_images_for_trained_model(pic_dir, dirs_list)  # Getting the images ready for prediction
        images_ready_for_prediction = images_ready_for_prediction / 255.0  # normalizing

        prediction = self.ML_model.predict(images_ready_for_prediction)  # Predicting the ratios for the images
        prediction_mul_list = prediction.tolist()
        prediction_list = [val for sublist in prediction_mul_list for val in sublist]  # Using list comprehension
        print(prediction_list)
        for i in range(len(dirs_list)):
            print("X(image dir)=%s, Predicted value=%s" % (dirs_list[i], prediction[i]))  # Printing the predictions

        best_image_dir = dirs_list[prediction_list.index(max(prediction_list))]  # Super sick!!
        print("The best image is: " + best_image_dir + " !!!!")

        client_sock.send(best_image_dir[7:].encode())  # Sending the best image dir to the client

        self.sem.release()  # Releasing the client after he has gotten his result.

    def receiving_loop(self, client_sock):  # Not used, using the encrypted version
        """This is one of the most important functions in the server! It receives the client socket and reads
        from it until it reaches the \r\n\r\n (marking the client is sending image data now. This function returns
        the filesize, filename and might contain the beginning of the image data!"""
        part = b""
        final_parts = []
        start_of_image = b""
        while True:
            received = self.decryptor.decrypt(client_sock.recv(1024))
            # received = client_sock.recv(1024)
            if b"\r\n\r\n" in received:  # Checking if we have reached the image data
                parts = received.split(b"\r\n\r\n")  # Getting the part before the image metadata(size,name) and after.
                print("Reached image metadata!")
                final_parts.append(part + parts[0])  # Parts[0] should contain a piece of a part
                start_of_image += parts[1]  # Probably going to contain the start of the image data
                break
            else:
                part += received  # Just adding the total message since haven't reached image data
        parts_again = final_parts[0].split(b"\r\n")
        filesize = parts_again[0].decode()  # Getting string instead of bytes
        filename = parts_again[1].decode()  # Getting string instead of bytes
        return filesize, filename, start_of_image

    def encrypted_receiving_loop(self, client_sock, size_left, metadata_start):
        """This is one of the most important functions in the server! It receives the client socket, the amount of bytes
        left to read from the buffer until the end of the message, and the metadata start if there is one. The function
        returns the image name and the image data."""
        metadata_total = metadata_start  # Starting the total with the start of the metadata
        how_many_bytes = 2048  # The amount of bytes that we are going to receive
        while size_left > 0:  # Running in a loop while we did not receive the whole size.
            if size_left < how_many_bytes:  # This will happen on the last recv needed
                how_many_bytes = size_left
            data = client_sock.recv(how_many_bytes)  # Reading from the buffer
            size_left -= len(data)  # Decreasing the bytes left to read from the buffer.
            metadata_total += data

        decrypted_metadata = self.decryptor.decrypt(metadata_total)  # Decrypting the metadata.

        parts_of_metadata = decrypted_metadata.split(b"\r\n\r\n")  # Getting the name and image_parts
        image_name = parts_of_metadata[0].decode()  # Need the string of the image_name
        image_data = parts_of_metadata[1]  # Need to leave the image_data as bytes
        return image_name, image_data

    def get_images_from_user(self, client_sock, thread_num):
        """This function gets the client socket and the thread number. This function receives all of the client's
        image files, this includes the filesizes the filenames and the actual images. This function then goes on
        and calls predict_on_images_and_send_result."""
        print('You are thread number: ' + str(thread_num))
        self.sem.acquire()  # Decreases the users logged in at the time (new thread opened)
        number_of_files = int(client_sock.recv(1024).decode())
        print(f"The number of files that the user is going to send is: {number_of_files}")
        subfolder_name = "thread" + str(thread_num)
        if not os.path.isdir(self.server_file_extract_dir + str(thread_num)):
            os.mkdir(subfolder_name)  # Create the subfolder
            
        for i in range(number_of_files):
            # receive the file infos
            print("Receiving file number " + str(i+1))

            initial_receiver = client_sock.recv(8192)  # Fist initial
            print(initial_receiver)
            parts = initial_receiver.split(b"\r\n", 1)  # Only splitting it once. Want the size of the metadata
            metadata_size = int(parts[0].decode())  # Getting the int size of the metadata
            metadata_start = parts[1]  # Might have some of the metadata in the initial_receiver
            total_size_left_to_recv = metadata_size - len(metadata_start)  # How many more bytes left for recv.

            filename, image_bytes = self.encrypted_receiving_loop(client_sock, total_size_left_to_recv, metadata_start)
            # Getting the filename and the image_bytes data
            filename = os.path.basename(filename)  # Getting the basename of the file (for example image1.jpg)
            print(f"os path basename is: {filename}")
            file_dir_with_file = self.server_file_extract_dir + str(thread_num) + "/server_" + filename
            # Building the full path name

            print(f"Started saving picture number {i+1}, the name of it is: {filename}")
            with open(file_dir_with_file, "wb") as f:  # Going to be writing bytes to the file.
                f.write(image_bytes)  # Inserting the bytes into the image and creating it.
            print(f"Finished download for file number {i+1}, the name of it is: {filename}")

        self.predict_on_images_and_send_result(client_sock, self.server_file_extract_dir + str(thread_num))

    def start(self):
        """This is the server start function that is called in the beginning. This function accepts new clients
        and starts the thread for them with the appropriate thread number."""
        try:
            print(self.encryption_key)
            print(f"Server starting up on {self.IP} port {self.PORT}")
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)  # Initializing the socket.

            sock.bind((self.IP, self.PORT))
            sock.listen(1)  # Getting one client at a time.
            thread_number = 0  # This will be sort of an ID for the thread, used in debugging
            while True:  # Keep accepting as many people that want to help (speed up the process)
                thread_number += 1  # Increasing because of new client
                print('\r\nWaiting for a new client')
                client_socket, client_address = sock.accept()

                print('New client entered!')
                client_socket.sendall('Hello and welcome to Statispic\'s server. '
                                      'We hope we can help you achieve your goals on becoming an'
                                      'instagram star!\r\nCreated by: Tomer Cahal'.encode())  # Message to the user
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
#         #target = os.path.join(self.server_file_extract_dir, filename)
#         target = self.server_file_extract_dir + "/" + filename
#         print(source, target)
#         with source, target:
#             shutil.copyfile(source, target)
#     print("Done extracting...")