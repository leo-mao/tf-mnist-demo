import tensorflow as tf
from tensorflow.examples.tutorials.mnist import input_data


INPUT_NODE = 784
OUTPUT_NODE = 10

LAYER1_NODE = 500
BATCH_SIZE = 100

LEARNING_RATE_BASE = 0.8
LEARNING_RATE_DECAY = 0.99
REGULARIZATION_RATE = 1e-4
TRAINING_STEPS = 30000
MOVING_AVERAGE_DECAY = 0.99


def inference(input, avg_class, w1, b1, w2, b2):
    if avg_class is None:

        layer1 = tf.nn.relu(tf.matmul(input, w1) + b1)

        return tf.matmul(layer1, w2) + b2

    else:
        layer1 = tf.nn.relu(tf.matmul(input, avg_class.average(w1)) +
                            avg_class.average(b1))
        return tf.matmul(layer1, avg_class.average(w2)) + avg_class.average(b2)


def predict(input, checkpoint_dir):
    x = tf.placeholder(tf.float32, [None, INPUT_NODE],  name='x-input')

    w1 = tf.Variable(tf.truncated_normal([INPUT_NODE, LAYER1_NODE], stddev=0.1))
    b1 = tf.Variable(tf.constant(0.1, shape=[LAYER1_NODE]))

    w2 = tf.Variable(tf.truncated_normal([LAYER1_NODE, OUTPUT_NODE], stddev=0.1))
    b2 = tf.Variable(tf.constant(0.1, shape=[OUTPUT_NODE]))
    y = inference(x, None, w1, b1, w2, b2)

    init_op = tf.global_variables_initializer()
    saver = tf.train.Saver()

    with tf.Session() as sess:
        sess.run(init_op)
        saver.restore(sess, tf.train.latest_checkpoint(checkpoint_dir))

        # prediction=tf.argmax(y,1)
        # result=prediction.eval(feed_dict={x: input}, session=sess)
        result = sess.run(y, feed_dict={x: input})
        print(result)
        return result.flatten().tolist()


def model(dataset, checkpoint_dir):
    x = tf.placeholder(tf.float32, [None, INPUT_NODE],  name='x-input')
    y_ = tf.placeholder(tf.float32, [None, OUTPUT_NODE], name='y-input')

    w1 = tf.Variable(tf.truncated_normal([INPUT_NODE, LAYER1_NODE], stddev=0.1))
    b1 = tf.Variable(tf.constant(0.1, shape=[LAYER1_NODE]))

    w2 = tf.Variable(tf.truncated_normal([LAYER1_NODE, OUTPUT_NODE], stddev=0.1))
    b2 = tf.Variable(tf.constant(0.1, shape=[OUTPUT_NODE]))

    y = inference(x, None, w1, b1, w2, b2)
    global_step = tf.Variable(0, trainable=False)

    variable_averages = tf.train.ExponentialMovingAverage(MOVING_AVERAGE_DECAY, global_step)
    variables_averages_op = variable_averages.apply(tf.trainable_variables())

    average_y = inference(x, variable_averages, w1, b1, w2, b2)


    cross_entropy = tf.nn.sparse_softmax_cross_entropy_with_logits(logits=y, labels=tf.argmax(y_, 1))
    cross_entropy_mean = tf.reduce_mean(cross_entropy)

    regularizer = tf.contrib.layers.l2_regularizer(REGULARIZATION_RATE)
    regularization = regularizer(w1) + regularizer(w2)

    loss = cross_entropy_mean + regularization

    ln_rate = tf.train.exponential_decay(LEARNING_RATE_BASE, global_step, dataset.train.num_examples / BATCH_SIZE,
                                               LEARNING_RATE_DECAY)

    train_step = tf.train.GradientDescentOptimizer(ln_rate).minimize(loss, global_step=global_step)

    with tf.control_dependencies([train_step, variables_averages_op]):
        train_op = tf.no_op(name='train')

    correct_prediction = tf.equal(tf.argmax(average_y, 1), tf.argmax(y_, 1))
    accuracy = tf.reduce_mean(tf.cast(correct_prediction, tf.float32))

    # Train
    with tf.Session() as sess:
        tf.global_variables_initializer().run()
        validate_feed = {x: dataset.validation.images,
                         y_: dataset.validation.labels}

        saver = tf.train.Saver()
        try:

            saver.restore(sess, tf.train.latest_checkpoint(checkpoint_dir))
        except Exception as e:
            print(e)
            print('No available checkpoint')
            for i in range(TRAINING_STEPS):
                if i % 1000 == 0:
                    validate_acc = sess.run(accuracy, feed_dict=validate_feed)
                    print("After %d training steps, validation accuracy using average model is %g" % (i, validate_acc))
                xs, ys = dataset.train.next_batch(BATCH_SIZE)
                sess.run(train_op, feed_dict={x: xs, y_: ys})

            saver.save(sess, checkpoint_dir)

        test_feed = {x: dataset.test.images, y_: dataset.test.labels}
        test_acc = sess.run(accuracy, feed_dict=test_feed)
        print("After %d training step(s), test accuracy using average model is %g" % (TRAINING_STEPS, test_acc))


def main():
    import os
    base_path = os.path.dirname(os.path.realpath(__file__))
    ckpt = base_path + '/checkpoints/'
    dataset = input_data.read_data_sets('MNIST_data', one_hot=True)
    model(dataset, ckpt)


if __name__ == '__main__':
    tf.app.run()

#https://blog.csdn.net/wangsiji_buaa/article/details/80205629#
