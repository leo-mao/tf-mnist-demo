import numpy as np
import tensorflow as tf
import os

from flask import Flask, jsonify, render_template, request

from mnist import predict


x = tf.placeholder("float", [None, 784])
sess = tf.Session()

app = Flask(__name__)

@app.route('/api/mnist', methods=['post'])
def mnist():
    input = ((255 - np.array(request.json, dtype=np.uint8)) / 255.0).reshape(1, 784)
    base_path = os.path.dirname(os.path.realpath(__file__))
    ckpt = base_path + '/checkpoints/'
    output = predict(input, ckpt)

    return jsonify(results=[output])

@app.route('/')
def main():
    return render_template('index.html')

if __name__ == '__main__':
    app.run()